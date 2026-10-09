package com.agrorent.backend.service.impl;

import com.agrorent.backend.dto.BookingCreateRequest;
import com.agrorent.backend.dto.BookingResponse;
import com.agrorent.backend.exception.ResourceNotFoundException;
import com.agrorent.backend.exception.UnauthorizedActionException;
import com.agrorent.backend.model.Booking;
import com.agrorent.backend.model.Equipment;
import com.agrorent.backend.model.Farmer;
import com.agrorent.backend.repository.BookingRepository;
import com.agrorent.backend.repository.EquipmentRepository;
import com.agrorent.backend.repository.FarmerRepository;
import com.agrorent.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for equipment rental bookings.
 * Enforces server-side identity resolution, financial calculation, date boundary validation,
 * availability locking, and cancellation constraints.
 */
@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final FarmerRepository farmerRepository;

    @Autowired
    public BookingServiceImpl(BookingRepository bookingRepository,
                               EquipmentRepository equipmentRepository,
                               FarmerRepository farmerRepository) {
        this.bookingRepository = bookingRepository;
        this.equipmentRepository = equipmentRepository;
        this.farmerRepository = farmerRepository;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(BookingCreateRequest request, String renterEmail) {
        String normalizedEmail = renterEmail != null ? renterEmail.trim().toLowerCase() : "";
        Farmer renter = farmerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated renter farmer profile not found."));

        // Pessimistic Write Lock on equipment row to handle concurrent booking attempts cleanly
        Equipment equipment = equipmentRepository.findByIdWithPessimisticLock(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment listing not found with ID: " + request.getEquipmentId()));

        // Rule 1: Check listing availability status
        if (!Boolean.TRUE.equals(equipment.getIsAvailable())) {
            throw new IllegalStateException("This equipment listing is currently unavailable for rent.");
        }

        // Rule 2: Reject self-booking
        if (equipment.getOwner().getId().equals(renter.getId())) {
            throw new IllegalArgumentException("Farmers cannot rent their own equipment listing.");
        }

        // Rule 3: Validate start time
        if (request.getStartDateTime() == null || request.getStartDateTime().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new IllegalArgumentException("Booking start date/time cannot be in the past.");
        }

        // Rule 4: Calculate end time based on price unit
        String priceUnit = equipment.getPriceUnit().trim().toLowerCase();
        LocalDateTime endDateTime;
        if ("day".equals(priceUnit)) {
            endDateTime = request.getStartDateTime().plusDays(request.getDuration());
        } else {
            endDateTime = request.getStartDateTime().plusHours(request.getDuration());
        }

        // Rule 5: Determine lifecycle status based on bookingType and optional bookingMode
        String listingBookingType = equipment.getBookingType().trim().toLowerCase();
        String initialStatus;

        if ("instant".equals(listingBookingType)) {
            initialStatus = "APPROVED";
        } else if ("request".equals(listingBookingType)) {
            initialStatus = "PENDING";
        } else if ("both".equals(listingBookingType)) {
            if (request.getBookingMode() == null || request.getBookingMode().trim().isEmpty()) {
                throw new IllegalArgumentException("This equipment listing supports both instant booking and owner approval. Please specify a valid bookingMode ('instant' or 'request').");
            }
            String mode = request.getBookingMode().trim().toLowerCase();
            if ("instant".equals(mode)) {
                initialStatus = "APPROVED";
            } else if ("request".equals(mode)) {
                initialStatus = "PENDING";
            } else {
                throw new IllegalArgumentException("Invalid bookingMode. Must be either 'instant' or 'request'.");
            }
        } else {
            initialStatus = "PENDING";
        }

        // Rule 6: Check overlapping active bookings
        // Instant bookings (APPROVED) block both PENDING and APPROVED.
        // PENDING requests block APPROVED bookings, but multiple PENDING requests can overlap until owner approval.
        List<String> blockingStatuses = "APPROVED".equalsIgnoreCase(initialStatus)
                ? List.of("PENDING", "APPROVED")
                : List.of("APPROVED");

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                equipment.getId(), request.getStartDateTime(), endDateTime, blockingStatuses);
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("The selected equipment is unavailable due to an existing booking conflict during the requested time period.");
        }


        // Rule 7: Snapshot rate and calculate total price on server
        BigDecimal rateSnapshot = equipment.getPrice();
        BigDecimal totalPrice = rateSnapshot.multiply(BigDecimal.valueOf(request.getDuration()));

        Booking booking = new Booking(
                equipment,
                renter,
                equipment.getOwner(),
                request.getStartDateTime(),
                endDateTime,
                request.getDuration(),
                priceUnit,
                rateSnapshot,
                totalPrice,
                initialStatus,
                request.getNotes() != null ? request.getNotes().trim() : null
        );

        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponse(savedBooking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getRenterBookings(String renterEmail) {
        String normalizedEmail = renterEmail != null ? renterEmail.trim().toLowerCase() : "";
        List<Booking> bookings = bookingRepository.findByRenterEmailOrderByCreatedAtDesc(normalizedEmail);
        return bookings.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id, String renterEmail) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        String normalizedEmail = renterEmail != null ? renterEmail.trim().toLowerCase() : "";
        if (!booking.getRenter().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to view this booking.");
        }

        return mapToResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long id, String renterEmail) {
        Booking initialBooking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        String normalizedEmail = renterEmail != null ? renterEmail.trim().toLowerCase() : "";
        if (!initialBooking.getRenter().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to cancel this booking because you are not the renter.");
        }

        // 1. Acquire pessimistic write lock on equipment row FIRST to serialize cancellation vs concurrent approval/creation
        Equipment equipment = equipmentRepository.findByIdWithPessimisticLock(initialBooking.getEquipment().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated equipment listing not found."));

        // 2. Perform pessimistic locking read on booking row SECOND (bypasses MVCC snapshot, loads fresh committed state)
        Booking booking = bookingRepository.findByIdWithPessimisticLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        // 3. Re-verify renter authorization and status on fresh booking
        if (!booking.getRenter().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to cancel this booking because you are not the renter.");
        }

        String currentStatus = booking.getStatus().toUpperCase();

        if ("CANCELLED".equals(currentStatus) || "REJECTED".equals(currentStatus) || "COMPLETED".equals(currentStatus)) {
            throw new IllegalStateException("Booking cannot be cancelled because its current status is " + currentStatus + ".");
        }

        if ("APPROVED".equals(currentStatus)) {
            if (!LocalDateTime.now().isBefore(booking.getStartDateTime())) {
                throw new IllegalStateException("Approved bookings cannot be cancelled once the rental start time has arrived.");
            }
        }

        booking.setStatus("CANCELLED");
        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkAvailability(Long equipmentId, LocalDateTime startDateTime, Integer duration) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment listing not found with ID: " + equipmentId));

        if (!Boolean.TRUE.equals(equipment.getIsAvailable())) {
            return false;
        }

        String priceUnit = equipment.getPriceUnit().trim().toLowerCase();
        LocalDateTime endDateTime = "day".equals(priceUnit)
                ? startDateTime.plusDays(duration)
                : startDateTime.plusHours(duration);

        List<String> blockingStatuses = List.of("PENDING", "APPROVED");
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                equipmentId, startDateTime, endDateTime, blockingStatuses);

        return conflicts.isEmpty();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getOwnerBookings(String ownerEmail, String status) {
        String normalizedEmail = ownerEmail != null ? ownerEmail.trim().toLowerCase() : "";
        List<Booking> bookings;

        if (status != null && !status.trim().isEmpty()) {
            String normalizedStatus = status.trim().toUpperCase();
            List<String> validStatuses = List.of("PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED");
            if (!validStatuses.contains(normalizedStatus)) {
                throw new IllegalArgumentException("Invalid status parameter: '" + status + "'. Valid status values are: PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED.");
            }
            bookings = bookingRepository.findByOwnerEmailAndStatusOrderByCreatedAtDesc(normalizedEmail, normalizedStatus);
        } else {
            bookings = bookingRepository.findByOwnerEmailOrderByCreatedAtDesc(normalizedEmail);
        }

        return bookings.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getOwnerBookingById(Long id, String ownerEmail) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        String normalizedEmail = ownerEmail != null ? ownerEmail.trim().toLowerCase() : "";
        if (!booking.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to view this booking as you are not the equipment owner.");
        }

        return mapToResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse approveBooking(Long id, String ownerEmail) {
        Booking initialBooking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        String normalizedEmail = ownerEmail != null ? ownerEmail.trim().toLowerCase() : "";
        if (!initialBooking.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to approve this booking as you are not the equipment owner.");
        }

        // 1. Acquire pessimistic write lock on equipment row FIRST
        Equipment equipment = equipmentRepository.findByIdWithPessimisticLock(initialBooking.getEquipment().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated equipment listing not found."));

        // 2. Perform pessimistic locking read on booking row SECOND (bypasses MVCC snapshot, loads fresh committed state)
        Booking booking = bookingRepository.findByIdWithPessimisticLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        // 3. Re-verify owner authorization and status on fresh booking
        if (!booking.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to approve this booking as you are not the equipment owner.");
        }

        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Only PENDING bookings can be approved. Current status is " + booking.getStatus() + ".");
        }

        // 4. Check for other overlapping bookings with status APPROVED (excluding self)
        List<String> blockingStatuses = List.of("APPROVED");
        List<Booking> conflictingApproved = bookingRepository.findConflictingBookingsExcludingSelf(
                equipment.getId(), booking.getId(), booking.getStartDateTime(), booking.getEndDateTime(), blockingStatuses);

        if (!conflictingApproved.isEmpty()) {
            throw new IllegalStateException("Cannot approve this booking because another approved booking conflicts with this time period.");
        }

        booking.setStatus("APPROVED");
        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public BookingResponse rejectBooking(Long id, String ownerEmail) {
        Booking initialBooking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        String normalizedEmail = ownerEmail != null ? ownerEmail.trim().toLowerCase() : "";
        if (!initialBooking.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to reject this booking as you are not the equipment owner.");
        }

        Equipment equipment = equipmentRepository.findByIdWithPessimisticLock(initialBooking.getEquipment().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated equipment listing not found."));

        Booking booking = bookingRepository.findByIdWithPessimisticLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        if (!booking.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to reject this booking as you are not the equipment owner.");
        }

        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Only PENDING bookings can be rejected. Current status is " + booking.getStatus() + ".");
        }

        booking.setStatus("REJECTED");
        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public BookingResponse completeBooking(Long id, String ownerEmail) {
        Booking initialBooking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        String normalizedEmail = ownerEmail != null ? ownerEmail.trim().toLowerCase() : "";
        if (!initialBooking.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to mark this booking as completed as you are not the equipment owner.");
        }

        Equipment equipment = equipmentRepository.findByIdWithPessimisticLock(initialBooking.getEquipment().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated equipment listing not found."));

        Booking booking = bookingRepository.findByIdWithPessimisticLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        if (!booking.getOwner().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new UnauthorizedActionException("You are not authorized to mark this booking as completed as you are not the equipment owner.");
        }

        if (!"APPROVED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Only APPROVED bookings can be marked as COMPLETED. Current status is " + booking.getStatus() + ".");
        }

        booking.setStatus("COMPLETED");
        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }





    private BookingResponse mapToResponse(Booking booking) {
        String imageUrl = booking.getEquipment().getImageUrl();
        return new BookingResponse(
                booking.getId(),
                booking.getEquipment().getId(),
                booking.getEquipment().getName(),
                booking.getEquipment().getCategory(),
                imageUrl != null ? imageUrl : "",
                booking.getEquipment().getLocation(),
                booking.getRenter().getId(),
                booking.getRenter().getFullName(),
                booking.getOwner().getId(),
                booking.getOwner().getFullName(),
                booking.getStartDateTime(),
                booking.getEndDateTime(),
                booking.getDuration(),
                booking.getPriceUnit(),
                booking.getRateSnapshot(),
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getNotes(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
