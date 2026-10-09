package com.agrorent.backend.service;

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
import com.agrorent.backend.service.impl.BookingServiceImpl;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private FarmerRepository farmerRepository;

    @InjectMocks
    private BookingServiceImpl bookingService;



    private Farmer owner;
    private Farmer renter;
    private Equipment instantEquipment;
    private Equipment requestEquipment;
    private Equipment bothEquipment;
    private Booking existingBooking;

    @BeforeEach
    void setUp() {
        owner = new Farmer();
        owner.setId(1L);
        owner.setFullName("Owner Farmer");
        owner.setEmail("owner@farm.com");
        owner.setPhone("9876543210");

        renter = new Farmer();
        renter.setId(2L);
        renter.setFullName("Renter Farmer");
        renter.setEmail("renter@farm.com");
        renter.setPhone("9876543211");

        instantEquipment = new Equipment();
        instantEquipment.setId(10L);
        instantEquipment.setName("John Deere Tractor");
        instantEquipment.setCategory("Tractors");
        instantEquipment.setPrice(new BigDecimal("500.00"));
        instantEquipment.setPriceUnit("hour");
        instantEquipment.setBookingType("instant");
        instantEquipment.setLocation("Punjab");
        instantEquipment.setIsAvailable(true);
        instantEquipment.setOwner(owner);

        requestEquipment = new Equipment();
        requestEquipment.setId(20L);
        requestEquipment.setName("Combine Harvester");
        requestEquipment.setCategory("Harvesters");
        requestEquipment.setPrice(new BigDecimal("3000.00"));
        requestEquipment.setPriceUnit("day");
        requestEquipment.setBookingType("request");
        requestEquipment.setLocation("Punjab");
        requestEquipment.setIsAvailable(true);
        requestEquipment.setOwner(owner);

        bothEquipment = new Equipment();
        bothEquipment.setId(30L);
        bothEquipment.setName("Rotavator");
        bothEquipment.setCategory("Rotavators");
        bothEquipment.setPrice(new BigDecimal("400.00"));
        bothEquipment.setPriceUnit("hour");
        bothEquipment.setBookingType("both");
        bothEquipment.setLocation("Punjab");
        bothEquipment.setIsAvailable(true);
        bothEquipment.setOwner(owner);

        existingBooking = new Booking();
        existingBooking.setId(100L);
        existingBooking.setEquipment(instantEquipment);
        existingBooking.setRenter(renter);
        existingBooking.setOwner(owner);
        existingBooking.setStartDateTime(LocalDateTime.now().plusDays(1));
        existingBooking.setEndDateTime(LocalDateTime.now().plusDays(1).plusHours(5));
        existingBooking.setDuration(5);
        existingBooking.setPriceUnit("hour");
        existingBooking.setRateSnapshot(new BigDecimal("500.00"));
        existingBooking.setTotalPrice(new BigDecimal("2500.00"));
        existingBooking.setStatus("PENDING");
    }

    @Test
    @DisplayName("Should create APPROVED booking for instant bookingType equipment")
    void testCreateInstantBookingSuccess() {
        when(farmerRepository.findByEmail("renter@farm.com")).thenReturn(Optional.of(renter));
        when(equipmentRepository.findByIdWithPessimisticLock(10L)).thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findConflictingBookings(anyLong(), any(), any(), anyList())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            b.setId(101L);
            return b;
        });

        LocalDateTime start = LocalDateTime.now().plusHours(2);
        BookingCreateRequest req = new BookingCreateRequest(10L, start, 4, "Need tractor for tilling", null);

        BookingResponse response = bookingService.createBooking(req, "renter@farm.com");

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("APPROVED", response.getStatus());
        assertEquals(new BigDecimal("500.00"), response.getRateSnapshot());
        assertEquals(new BigDecimal("2000.00"), response.getTotalPrice());
        assertEquals(start.plusHours(4), response.getEndDateTime());
    }

    @Test
    @DisplayName("Should create PENDING booking for request bookingType equipment")
    void testCreateRequestBookingSuccess() {
        when(farmerRepository.findByEmail("renter@farm.com")).thenReturn(Optional.of(renter));
        when(equipmentRepository.findByIdWithPessimisticLock(20L)).thenReturn(Optional.of(requestEquipment));
        when(bookingRepository.findConflictingBookings(anyLong(), any(), any(), anyList())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            b.setId(102L);
            return b;
        });

        LocalDateTime start = LocalDateTime.now().plusDays(2);
        BookingCreateRequest req = new BookingCreateRequest(20L, start, 3, "Harvester request", null);

        BookingResponse response = bookingService.createBooking(req, "renter@farm.com");

        assertNotNull(response);
        assertEquals(102L, response.getId());
        assertEquals("PENDING", response.getStatus());
        assertEquals(new BigDecimal("9000.00"), response.getTotalPrice());
        assertEquals(start.plusDays(3), response.getEndDateTime());
    }

    @Test
    @DisplayName("Should create booking for 'both' bookingType using explicit bookingMode")
    void testCreateBothBookingWithMode() {
        when(farmerRepository.findByEmail("renter@farm.com")).thenReturn(Optional.of(renter));
        when(equipmentRepository.findByIdWithPessimisticLock(30L)).thenReturn(Optional.of(bothEquipment));
        when(bookingRepository.findConflictingBookings(anyLong(), any(), any(), anyList())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            b.setId(103L);
            return b;
        });

        LocalDateTime start = LocalDateTime.now().plusHours(3);
        BookingCreateRequest reqInstant = new BookingCreateRequest(30L, start, 2, "Instant mode", "instant");

        BookingResponse respInstant = bookingService.createBooking(reqInstant, "renter@farm.com");
        assertEquals("APPROVED", respInstant.getStatus());
    }

    @Test
    @DisplayName("Should reject self-booking attempt when owner tries to rent own listing")
    void testSelfBookingRejected() {
        when(farmerRepository.findByEmail("owner@farm.com")).thenReturn(Optional.of(owner));
        when(equipmentRepository.findByIdWithPessimisticLock(10L)).thenReturn(Optional.of(instantEquipment));

        BookingCreateRequest req = new BookingCreateRequest(10L, LocalDateTime.now().plusHours(2), 2, null, null);

        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req, "owner@farm.com"));
    }

    @Test
    @DisplayName("Should reject booking for unavailable equipment")
    void testUnavailableEquipmentRejected() {
        instantEquipment.setIsAvailable(false);
        when(farmerRepository.findByEmail("renter@farm.com")).thenReturn(Optional.of(renter));
        when(equipmentRepository.findByIdWithPessimisticLock(10L)).thenReturn(Optional.of(instantEquipment));

        BookingCreateRequest req = new BookingCreateRequest(10L, LocalDateTime.now().plusHours(2), 2, null, null);

        assertThrows(IllegalStateException.class, () -> bookingService.createBooking(req, "renter@farm.com"));
    }

    @Test
    @DisplayName("Should reject past start time")
    void testPastStartTimeRejected() {
        when(farmerRepository.findByEmail("renter@farm.com")).thenReturn(Optional.of(renter));
        when(equipmentRepository.findByIdWithPessimisticLock(10L)).thenReturn(Optional.of(instantEquipment));

        BookingCreateRequest req = new BookingCreateRequest(10L, LocalDateTime.now().minusDays(1), 2, null, null);

        assertThrows(IllegalArgumentException.class, () -> bookingService.createBooking(req, "renter@farm.com"));
    }

    @Test
    @DisplayName("Should reject booking when conflicting overlapping active booking exists")
    void testOverlappingBookingConflictRejected() {
        when(farmerRepository.findByEmail("renter@farm.com")).thenReturn(Optional.of(renter));
        when(equipmentRepository.findByIdWithPessimisticLock(10L)).thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findConflictingBookings(anyLong(), any(), any(), anyList())).thenReturn(List.of(existingBooking));

        BookingCreateRequest req = new BookingCreateRequest(10L, LocalDateTime.now().plusDays(1), 2, null, null);

        assertThrows(IllegalStateException.class, () -> bookingService.createBooking(req, "renter@farm.com"));
    }

    @Test
    @DisplayName("Should allow renter to cancel PENDING booking after acquiring equipment lock")
    void testCancelPendingBookingSuccess() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(existingBooking);

        BookingResponse response = bookingService.cancelBooking(100L, "renter@farm.com");

        assertNotNull(response);
        assertEquals("CANCELLED", existingBooking.getStatus());
        verify(equipmentRepository).findByIdWithPessimisticLock(instantEquipment.getId());
        verify(bookingRepository).findByIdWithPessimisticLock(100L);
    }

    @Test
    @DisplayName("Should throw UnauthorizedActionException when non-renter attempts cancellation")
    void testCancelBookingNonRenterForbidden() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));

        assertThrows(UnauthorizedActionException.class, () -> bookingService.cancelBooking(100L, "owner@farm.com"));
    }

    @Test
    @DisplayName("Should reject cancellation for APPROVED booking after start time")
    void testCancelApprovedBookingAfterStartFails() {
        existingBooking.setStatus("APPROVED");
        existingBooking.setStartDateTime(LocalDateTime.now().minusHours(1)); // Started 1 hr ago
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));

        assertThrows(IllegalStateException.class, () -> bookingService.cancelBooking(100L, "renter@farm.com"));
    }

    @Test
    @DisplayName("Should reject approval if booking status is no longer PENDING after acquiring equipment lock and booking pessimistic lock")
    void testApproveBookingRejectsIfStatusNoLongerPendingAfterLock() {
        Booking cancelledBooking = new Booking();
        cancelledBooking.setId(100L);
        cancelledBooking.setEquipment(instantEquipment);
        cancelledBooking.setOwner(owner);
        cancelledBooking.setRenter(renter);
        cancelledBooking.setStatus("CANCELLED");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(cancelledBooking));

        assertThrows(IllegalStateException.class, () -> bookingService.approveBooking(100L, "owner@farm.com"));
        verify(equipmentRepository).findByIdWithPessimisticLock(instantEquipment.getId());
        verify(bookingRepository).findByIdWithPessimisticLock(100L);
    }

    @Test
    @DisplayName("Should allow owner to list all their bookings")
    void testGetOwnerBookingsSuccess() {
        when(bookingRepository.findByOwnerEmailOrderByCreatedAtDesc("owner@farm.com"))
                .thenReturn(List.of(existingBooking));

        List<BookingResponse> responses = bookingService.getOwnerBookings("owner@farm.com", null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(existingBooking.getId(), responses.get(0).getId());
    }

    @Test
    @DisplayName("Should filter owner bookings by valid status")
    void testGetOwnerBookingsWithStatusFilter() {
        when(bookingRepository.findByOwnerEmailAndStatusOrderByCreatedAtDesc("owner@farm.com", "PENDING"))
                .thenReturn(List.of(existingBooking));

        List<BookingResponse> responses = bookingService.getOwnerBookings("owner@farm.com", "PENDING");

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("PENDING", responses.get(0).getStatus());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when filtering owner bookings with invalid status")
    void testGetOwnerBookingsInvalidStatusFilter() {
        assertThrows(IllegalArgumentException.class,
                () -> bookingService.getOwnerBookings("owner@farm.com", "INVALID_STATUS"));
    }

    @Test
    @DisplayName("Should allow owner to retrieve details of their own booking")
    void testGetOwnerBookingByIdSuccess() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));

        BookingResponse response = bookingService.getOwnerBookingById(100L, "owner@farm.com");

        assertNotNull(response);
        assertEquals(100L, response.getId());
    }

    @Test
    @DisplayName("Should throw UnauthorizedActionException when non-owner tries to retrieve owner booking detail")
    void testGetOwnerBookingByIdForbiddenForNonOwner() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));

        assertThrows(UnauthorizedActionException.class,
                () -> bookingService.getOwnerBookingById(100L, "other_owner@farm.com"));
    }

    @Test
    @DisplayName("Should allow owner to approve a pending booking when no conflicting approved booking exists")
    void testApprovePendingBookingSuccess() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));
        when(bookingRepository.findConflictingBookingsExcludingSelf(
                eq(instantEquipment.getId()), eq(100L), any(), any(), eq(List.of("APPROVED"))))
                .thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse response = bookingService.approveBooking(100L, "owner@farm.com");

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        verify(bookingRepository).findConflictingBookingsExcludingSelf(
                eq(instantEquipment.getId()), eq(100L), any(), any(), eq(List.of("APPROVED")));
    }

    @Test
    @DisplayName("Should exclude the booking being approved itself during conflict check")
    void testApproveBookingExcludesSelfFromConflictCheck() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));
        when(bookingRepository.findConflictingBookingsExcludingSelf(
                eq(instantEquipment.getId()), eq(100L), any(), any(), eq(List.of("APPROVED"))))
                .thenReturn(List.of()); // No other approved conflicts
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        bookingService.approveBooking(100L, "owner@farm.com");

        // Verify that 100L (the booking's own ID) was passed to findConflictingBookingsExcludingSelf
        verify(bookingRepository).findConflictingBookingsExcludingSelf(
                eq(instantEquipment.getId()), eq(100L), any(), any(), eq(List.of("APPROVED")));
    }

    @Test
    @DisplayName("Should reject approval when an overlapping APPROVED booking exists")
    void testApproveBookingFailsWhenConflictingApprovedExists() {
        Booking approvedConflict = new Booking();
        approvedConflict.setId(200L);
        approvedConflict.setStatus("APPROVED");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));
        when(bookingRepository.findConflictingBookingsExcludingSelf(
                eq(instantEquipment.getId()), eq(100L), any(), any(), eq(List.of("APPROVED"))))
                .thenReturn(List.of(approvedConflict));

        assertThrows(IllegalStateException.class,
                () -> bookingService.approveBooking(100L, "owner@farm.com"));
    }

    @Test
    @DisplayName("Overlapping pending bookings remain pending when another request is approved")
    void testOverlappingPendingBookingsRemainPendingOnApproval() {
        Booking pendingOther = new Booking();
        pendingOther.setId(101L);
        pendingOther.setEquipment(instantEquipment);
        pendingOther.setOwner(owner);
        pendingOther.setStatus("PENDING");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));
        when(bookingRepository.findConflictingBookingsExcludingSelf(
                eq(instantEquipment.getId()), eq(100L), any(), any(), eq(List.of("APPROVED"))))
                .thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse response = bookingService.approveBooking(100L, "owner@farm.com");

        assertEquals("APPROVED", response.getStatus());
        // Verify pendingOther was NOT saved or modified to REJECTED
        assertEquals("PENDING", pendingOther.getStatus());
        verify(bookingRepository, never()).save(pendingOther);
    }

    @Test
    @DisplayName("Should throw UnauthorizedActionException when non-owner attempts approve, reject, or complete")
    void testNonOwnerOperationsForbidden() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));

        assertThrows(UnauthorizedActionException.class, () -> bookingService.approveBooking(100L, "stranger@farm.com"));
        assertThrows(UnauthorizedActionException.class, () -> bookingService.rejectBooking(100L, "stranger@farm.com"));
        assertThrows(UnauthorizedActionException.class, () -> bookingService.completeBooking(100L, "stranger@farm.com"));
    }

    @Test
    @DisplayName("Should allow owner to reject a pending booking")
    void testRejectPendingBookingSuccess() {
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(existingBooking);

        BookingResponse response = bookingService.rejectBooking(100L, "owner@farm.com");

        assertNotNull(response);
        assertEquals("REJECTED", existingBooking.getStatus());
    }

    @Test
    @DisplayName("Should allow owner to complete an approved booking")
    void testCompleteApprovedBookingSuccess() {
        existingBooking.setStatus("APPROVED");
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(existingBooking);

        BookingResponse response = bookingService.completeBooking(100L, "owner@farm.com");

        assertNotNull(response);
        assertEquals("COMPLETED", existingBooking.getStatus());
    }

    @Test
    @DisplayName("Should reject invalid status transitions for owner actions")
    void testInvalidStatusTransitionsRejected() {
        // 1. Cannot approve an already APPROVED booking
        existingBooking.setStatus("APPROVED");
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(existingBooking));
        when(equipmentRepository.findByIdWithPessimisticLock(instantEquipment.getId()))
                .thenReturn(Optional.of(instantEquipment));
        when(bookingRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(existingBooking));
        assertThrows(IllegalStateException.class, () -> bookingService.approveBooking(100L, "owner@farm.com"));

        // 2. Cannot reject an APPROVED booking
        assertThrows(IllegalStateException.class, () -> bookingService.rejectBooking(100L, "owner@farm.com"));

        // 3. Cannot complete a PENDING booking
        existingBooking.setStatus("PENDING");
        assertThrows(IllegalStateException.class, () -> bookingService.completeBooking(100L, "owner@farm.com"));
    }
}



