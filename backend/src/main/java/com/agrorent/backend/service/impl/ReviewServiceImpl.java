package com.agrorent.backend.service.impl;

import com.agrorent.backend.dto.EquipmentRatingSummary;
import com.agrorent.backend.dto.OwnerRatingSummary;
import com.agrorent.backend.dto.ReviewCreateRequest;
import com.agrorent.backend.dto.ReviewEligibilityResponse;
import com.agrorent.backend.dto.ReviewResponse;
import com.agrorent.backend.exception.DuplicateResourceException;
import com.agrorent.backend.exception.ResourceNotFoundException;
import com.agrorent.backend.exception.UnauthorizedActionException;
import com.agrorent.backend.model.Booking;
import com.agrorent.backend.model.Equipment;
import com.agrorent.backend.model.Farmer;
import com.agrorent.backend.model.Review;
import com.agrorent.backend.repository.BookingRepository;
import com.agrorent.backend.repository.EquipmentRepository;
import com.agrorent.backend.repository.FarmerRepository;
import com.agrorent.backend.repository.ReviewRepository;
import com.agrorent.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service implementation for managing owner and equipment reviews and ratings.
 */
@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final FarmerRepository farmerRepository;
    private final EquipmentRepository equipmentRepository;

    @Autowired
    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             BookingRepository bookingRepository,
                             FarmerRepository farmerRepository,
                             EquipmentRepository equipmentRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.farmerRepository = farmerRepository;
        this.equipmentRepository = equipmentRepository;
    }

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             BookingRepository bookingRepository,
                             FarmerRepository farmerRepository) {
        this(reviewRepository, bookingRepository, farmerRepository, null);
    }

    @Override
    public ReviewResponse submitReview(ReviewCreateRequest request, String reviewerEmail) {
        if (request == null) {
            throw new IllegalArgumentException("Review request body cannot be null");
        }

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be an integer between 1 and 5 stars");
        }

        String normalizedEmail = reviewerEmail != null ? reviewerEmail.trim().toLowerCase() : "";
        Farmer reviewer = farmerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated farmer account not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + request.getBookingId()));

        // Security check: only the booking's renter can review
        if (booking.getRenter() == null || !booking.getRenter().getId().equals(reviewer.getId())) {
            throw new UnauthorizedActionException("You are not authorized to review this booking. Only the renter may submit a review.");
        }

        // Business rule: only COMPLETED bookings can be reviewed
        if (!"COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Reviews can only be submitted for completed bookings. Current status is: " + booking.getStatus());
        }

        // Business rule: cannot review self if user is the owner
        if (booking.getOwner() != null && booking.getOwner().getId().equals(reviewer.getId())) {
            throw new IllegalArgumentException("You cannot review your own equipment booking as the owner.");
        }

        // Duplicate check
        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new DuplicateResourceException("A review has already been submitted for this booking.");
        }

        String cleanedFeedback = null;
        if (request.getFeedback() != null) {
            String trimmed = request.getFeedback().trim();
            if (!trimmed.isEmpty()) {
                if (trimmed.length() > 1000) {
                    throw new IllegalArgumentException("Feedback must not exceed 1000 characters");
                }
                cleanedFeedback = trimmed;
            }
        }

        Farmer owner = booking.getOwner();
        Equipment equipment = booking.getEquipment();
        if (equipment == null) {
            throw new IllegalStateException("Booking is not associated with valid equipment");
        }

        // Validate equipmentId if supplied by caller: must match the booking's equipment
        if (request.getEquipmentId() != null && !request.getEquipmentId().equals(equipment.getId())) {
            throw new IllegalArgumentException("The specified equipment ID does not match the equipment rented in this booking.");
        }

        Review review = new Review(booking, equipment, reviewer, owner, request.getRating(), cleanedFeedback);

        try {
            Review savedReview = reviewRepository.save(review);
            return mapToReviewResponse(savedReview);
        } catch (DataIntegrityViolationException ex) {
            // Catches database-level unique constraint uk_reviews_booking_id under race conditions
            throw new DuplicateResourceException("A review has already been submitted for this booking.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByEquipment(Long equipmentId) {
        if (equipmentId == null) {
            throw new IllegalArgumentException("Equipment ID must not be null");
        }

        if (equipmentRepository != null && !equipmentRepository.existsById(equipmentId)) {
            throw new ResourceNotFoundException("Equipment not found with ID: " + equipmentId);
        }

        List<Review> reviews = reviewRepository.findByEquipmentIdOrderByCreatedAtDesc(equipmentId);
        return reviews.stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EquipmentRatingSummary getEquipmentRatingSummary(Long equipmentId) {
        if (equipmentId == null) {
            throw new IllegalArgumentException("Equipment ID must not be null");
        }

        String equipmentName = "Equipment #" + equipmentId;
        Long ownerId = null;
        String ownerName = null;

        if (equipmentRepository != null) {
            Equipment equipment = equipmentRepository.findById(equipmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + equipmentId));
            equipmentName = equipment.getName();
            if (equipment.getOwner() != null) {
                ownerId = equipment.getOwner().getId();
                ownerName = equipment.getOwner().getFullName();
            }
        }

        long totalReviews = reviewRepository.countByEquipmentId(equipmentId);
        Double rawAverage = totalReviews > 0 ? reviewRepository.getAverageRatingByEquipmentId(equipmentId) : 0.0;
        double roundedAverage = rawAverage != null ? Math.round(rawAverage * 10.0) / 10.0 : 0.0;

        return new EquipmentRatingSummary(equipmentId, equipmentName, roundedAverage, totalReviews, ownerId, ownerName);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByOwner(Long ownerId) {
        if (ownerId == null) {
            throw new IllegalArgumentException("Owner ID must not be null");
        }

        if (!farmerRepository.existsById(ownerId)) {
            throw new ResourceNotFoundException("Equipment owner not found with ID: " + ownerId);
        }

        List<Review> reviews = reviewRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        return reviews.stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerRatingSummary getOwnerRatingSummary(Long ownerId) {
        if (ownerId == null) {
            throw new IllegalArgumentException("Owner ID must not be null");
        }

        Farmer owner = farmerRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment owner not found with ID: " + ownerId));

        long totalReviews = reviewRepository.countByOwnerId(ownerId);
        if (totalReviews == 0) {
            return OwnerRatingSummary.empty(ownerId, owner.getFullName());
        }

        Double avg = reviewRepository.getAverageRatingByOwnerId(ownerId);
        double roundedAverage = 0.0;
        if (avg != null) {
            roundedAverage = Math.round(avg * 10.0) / 10.0;
        }

        return new OwnerRatingSummary(ownerId, owner.getFullName(), roundedAverage, totalReviews);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse checkReviewEligibility(Long bookingId, String reviewerEmail) {
        if (bookingId == null) {
            return ReviewEligibilityResponse.ineligible(null, "Booking ID cannot be null");
        }

        String normalizedEmail = reviewerEmail != null ? reviewerEmail.trim().toLowerCase() : "";
        Optional<Farmer> reviewerOpt = farmerRepository.findByEmail(normalizedEmail);
        if (reviewerOpt.isEmpty()) {
            return ReviewEligibilityResponse.ineligible(bookingId, "Authenticated farmer not found");
        }
        Farmer reviewer = reviewerOpt.get();

        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return ReviewEligibilityResponse.ineligible(bookingId, "Booking not found");
        }
        Booking booking = bookingOpt.get();

        if (booking.getRenter() == null || !booking.getRenter().getId().equals(reviewer.getId())) {
            return ReviewEligibilityResponse.ineligible(bookingId, "You are not the renter of this booking");
        }

        if (booking.getOwner() != null && booking.getOwner().getId().equals(reviewer.getId())) {
            return ReviewEligibilityResponse.ineligible(bookingId, "You cannot review your own equipment");
        }

        Optional<Review> existingReview = reviewRepository.findByBookingId(bookingId);
        if (existingReview.isPresent()) {
            return ReviewEligibilityResponse.alreadyReviewed(bookingId, existingReview.get().getId());
        }

        if (!"COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            return ReviewEligibilityResponse.ineligible(bookingId,
                    "Booking is not completed (current status: " + booking.getStatus() + ")");
        }

        return ReviewEligibilityResponse.eligible(bookingId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> getReviewedBookingIds(String reviewerEmail) {
        String normalizedEmail = reviewerEmail != null ? reviewerEmail.trim().toLowerCase() : "";
        Farmer reviewer = farmerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated farmer account not found"));
        return reviewRepository.findReviewedBookingIdsByReviewerId(reviewer.getId());
    }

    /**
     * Map Review entity to safe ReviewResponse DTO.
     * Prevents leakage of passwords, emails, phone numbers, or tokens.
     */
    private ReviewResponse mapToReviewResponse(Review review) {
        Long bookingId = review.getBooking() != null ? review.getBooking().getId() : null;
        Long equipmentId = review.getEquipment() != null
                ? review.getEquipment().getId()
                : (review.getBooking() != null && review.getBooking().getEquipment() != null)
                ? review.getBooking().getEquipment().getId() : null;
        String equipmentName = review.getEquipment() != null
                ? review.getEquipment().getName()
                : (review.getBooking() != null && review.getBooking().getEquipment() != null)
                ? review.getBooking().getEquipment().getName() : null;

        Long reviewerId = review.getReviewer() != null ? review.getReviewer().getId() : null;
        String reviewerName = review.getReviewer() != null ? review.getReviewer().getFullName() : "Anonymous Farmer";
        String reviewerLocation = null;
        if (review.getReviewer() != null) {
            if (review.getReviewer().getDistrict() != null && review.getReviewer().getState() != null) {
                reviewerLocation = review.getReviewer().getDistrict() + ", " + review.getReviewer().getState();
            } else if (review.getReviewer().getDistrict() != null) {
                reviewerLocation = review.getReviewer().getDistrict();
            } else if (review.getReviewer().getState() != null) {
                reviewerLocation = review.getReviewer().getState();
            }
        }

        Long ownerId = review.getOwner() != null ? review.getOwner().getId() : null;
        String ownerName = review.getOwner() != null ? review.getOwner().getFullName() : "Equipment Owner";

        return new ReviewResponse(
                review.getId(),
                bookingId,
                equipmentId,
                equipmentName,
                reviewerId,
                reviewerName,
                reviewerLocation,
                ownerId,
                ownerName,
                review.getRating(),
                review.getFeedback(),
                review.getCreatedAt()
        );
    }
}
