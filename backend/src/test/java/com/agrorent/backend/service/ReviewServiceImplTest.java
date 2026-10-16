package com.agrorent.backend.service;

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
import com.agrorent.backend.repository.FarmerRepository;
import com.agrorent.backend.repository.ReviewRepository;
import com.agrorent.backend.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private FarmerRepository farmerRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private Farmer renter;
    private Farmer owner;
    private Farmer otherUser;
    private Equipment equipment;
    private Booking completedBooking;
    private Booking pendingBooking;

    @BeforeEach
    void setUp() {
        renter = new Farmer();
        renter.setId(10L);
        renter.setFullName("Ramesh Kumar");
        renter.setEmail("ramesh@example.com");
        renter.setVillage("Hampapura");
        renter.setDistrict("Mysuru");
        renter.setState("Karnataka");

        owner = new Farmer();
        owner.setId(20L);
        owner.setFullName("Suresh Gowda");
        owner.setEmail("suresh@example.com");
        owner.setVillage("Nanjangud");
        owner.setDistrict("Mysuru");
        owner.setState("Karnataka");

        otherUser = new Farmer();
        otherUser.setId(30L);
        otherUser.setFullName("Other Farmer");
        otherUser.setEmail("other@example.com");

        equipment = new Equipment();
        equipment.setId(100L);
        equipment.setName("Mahindra 575 DI Tractor");
        equipment.setCategory("TRACTOR");
        equipment.setOwner(owner);

        completedBooking = new Booking();
        completedBooking.setId(500L);
        completedBooking.setEquipment(equipment);
        completedBooking.setRenter(renter);
        completedBooking.setOwner(owner);
        completedBooking.setStatus("COMPLETED");
        completedBooking.setStartDateTime(LocalDateTime.now().minusDays(3));
        completedBooking.setEndDateTime(LocalDateTime.now().minusDays(2));
        completedBooking.setDuration(24);
        completedBooking.setPriceUnit("HOURLY");
        completedBooking.setRateSnapshot(new BigDecimal("600.00"));
        completedBooking.setTotalPrice(new BigDecimal("14400.00"));

        pendingBooking = new Booking();
        pendingBooking.setId(501L);
        pendingBooking.setEquipment(equipment);
        pendingBooking.setRenter(renter);
        pendingBooking.setOwner(owner);
        pendingBooking.setStatus("PENDING");
    }

    @Test
    @DisplayName("Scenario 1: Renter can successfully review their own completed booking")
    void testRenterCanReviewCompletedBooking() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 5, "Great tractor, worked very smoothly!");

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBooking));
        when(reviewRepository.existsByBookingId(500L)).thenReturn(false);

        Review savedReview = new Review(completedBooking, renter, owner, 5, "Great tractor, worked very smoothly!");
        savedReview.setId(1L);
        savedReview.setCreatedAt(LocalDateTime.now());
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);

        ReviewResponse response = reviewService.submitReview(request, "ramesh@example.com");

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(500L, response.getBookingId());
        assertEquals(5, response.getRating());
        assertEquals("Great tractor, worked very smoothly!", response.getFeedback());
        assertEquals("Ramesh Kumar", response.getReviewerName());
        assertEquals("Suresh Gowda", response.getOwnerName());
        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    @DisplayName("Scenario 2: Renter cannot review an incomplete booking (PENDING/APPROVED)")
    void testRenterCannotReviewIncompleteBooking() {
        ReviewCreateRequest request = new ReviewCreateRequest(501L, 4, "Too early to tell");

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(501L)).thenReturn(Optional.of(pendingBooking));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                reviewService.submitReview(request, "ramesh@example.com")
        );

        assertTrue(ex.getMessage().contains("completed"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Scenario 3: A user cannot review another renter's booking")
    void testUserCannotReviewAnotherRentersBooking() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 5, "Not my booking");

        when(farmerRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBooking));

        UnauthorizedActionException ex = assertThrows(UnauthorizedActionException.class, () ->
                reviewService.submitReview(request, "other@example.com")
        );

        assertTrue(ex.getMessage().contains("not authorized"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Scenario 4: A user cannot review their own booking as the owner")
    void testOwnerCannotReviewOwnBooking() {
        // If owner tries to submit review on this booking
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 5, "Self praise");

        // The booking has renter=renter, but if booking had owner=renter or if owner pretends to be renter:
        // Case A: Owner tries to review booking where owner == reviewer
        Booking selfBooking = new Booking();
        selfBooking.setId(502L);
        selfBooking.setRenter(owner);
        selfBooking.setOwner(owner);
        selfBooking.setStatus("COMPLETED");

        when(farmerRepository.findByEmail("suresh@example.com")).thenReturn(Optional.of(owner));
        when(bookingRepository.findById(502L)).thenReturn(Optional.of(selfBooking));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                reviewService.submitReview(new ReviewCreateRequest(502L, 5, "Self praise"), "suresh@example.com")
        );

        assertTrue(ex.getMessage().contains("cannot review your own equipment"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Scenario 5: Duplicate reviews are rejected")
    void testDuplicateReviewRejected() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 4, "Submitting second time");

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBooking));
        when(reviewRepository.existsByBookingId(500L)).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                reviewService.submitReview(request, "ramesh@example.com")
        );

        assertTrue(ex.getMessage().contains("already been submitted"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Scenario 5b: Concurrent duplicate review hitting database constraint is rejected as duplicate")
    void testConcurrentDuplicateReviewHandled() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 4, "Concurrent submission");

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBooking));
        when(reviewRepository.existsByBookingId(500L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenThrow(new DataIntegrityViolationException("uk_reviews_booking_id"));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                reviewService.submitReview(request, "ramesh@example.com")
        );

        assertTrue(ex.getMessage().contains("already been submitted"));
    }

    @Test
    @DisplayName("Scenario 6: Ratings below 1 or above 5 are rejected")
    void testInvalidRatingsRejected() {
        ReviewCreateRequest lowRating = new ReviewCreateRequest(500L, 0, "Too low");
        assertThrows(IllegalArgumentException.class, () ->
                reviewService.submitReview(lowRating, "ramesh@example.com")
        );

        ReviewCreateRequest highRating = new ReviewCreateRequest(500L, 6, "Too high");
        assertThrows(IllegalArgumentException.class, () ->
                reviewService.submitReview(highRating, "ramesh@example.com")
        );

        ReviewCreateRequest nullRating = new ReviewCreateRequest(500L, null, "No rating");
        assertThrows(IllegalArgumentException.class, () ->
                reviewService.submitReview(nullRating, "ramesh@example.com")
        );
    }

    @Test
    @DisplayName("Scenario 7: Unauthenticated / non-existent user cannot submit reviews")
    void testNonExistentUserCannotSubmitReview() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 5, "Feedback");

        when(farmerRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                reviewService.submitReview(request, "ghost@example.com")
        );
    }

    @Test
    @DisplayName("Scenario 7b: Non-existent booking cannot be reviewed")
    void testNonExistentBookingCannotBeReviewed() {
        ReviewCreateRequest request = new ReviewCreateRequest(999L, 5, "Feedback");

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                reviewService.submitReview(request, "ramesh@example.com")
        );
    }

    @Test
    @DisplayName("Scenario 8: Owner rating average and count are calculated correctly")
    void testOwnerRatingAverageAndCountCalculatedCorrectly() {
        when(farmerRepository.findById(20L)).thenReturn(Optional.of(owner));
        when(reviewRepository.countByOwnerId(20L)).thenReturn(2L);
        // (4 + 5) / 2 = 4.5
        when(reviewRepository.getAverageRatingByOwnerId(20L)).thenReturn(4.5);

        OwnerRatingSummary summary = reviewService.getOwnerRatingSummary(20L);

        assertNotNull(summary);
        assertEquals(20L, summary.getOwnerId());
        assertEquals("Suresh Gowda", summary.getOwnerName());
        assertEquals(2L, summary.getTotalReviews());
        assertEquals(4.5, summary.getAverageRating());
    }

    @Test
    @DisplayName("Scenario 9: Owner with no reviews returns appropriate empty state")
    void testOwnerWithNoReviewsReturnsEmptyState() {
        when(farmerRepository.findById(20L)).thenReturn(Optional.of(owner));
        when(reviewRepository.countByOwnerId(20L)).thenReturn(0L);

        OwnerRatingSummary summary = reviewService.getOwnerRatingSummary(20L);

        assertNotNull(summary);
        assertEquals(20L, summary.getOwnerId());
        assertEquals("Suresh Gowda", summary.getOwnerName());
        assertEquals(0L, summary.getTotalReviews());
        assertEquals(0.0, summary.getAverageRating());
        verify(reviewRepository, never()).getAverageRatingByOwnerId(anyLong());
    }

    @Test
    @DisplayName("Check review eligibility: Eligible completed booking")
    void testCheckReviewEligibilityEligible() {
        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBooking));
        when(reviewRepository.findByBookingId(500L)).thenReturn(Optional.empty());

        ReviewEligibilityResponse eligibility = reviewService.checkReviewEligibility(500L, "ramesh@example.com");

        assertTrue(eligibility.isEligible());
        assertFalse(eligibility.isAlreadyReviewed());
    }

    @Test
    @DisplayName("Check review eligibility: Already reviewed booking")
    void testCheckReviewEligibilityAlreadyReviewed() {
        Review existing = new Review();
        existing.setId(77L);

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBooking));
        when(reviewRepository.findByBookingId(500L)).thenReturn(Optional.of(existing));

        ReviewEligibilityResponse eligibility = reviewService.checkReviewEligibility(500L, "ramesh@example.com");

        assertFalse(eligibility.isEligible());
        assertTrue(eligibility.isAlreadyReviewed());
        assertEquals(77L, eligibility.getReviewId());
    }

    @Test
    @DisplayName("Check review eligibility: Incomplete booking")
    void testCheckReviewEligibilityIncomplete() {
        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(501L)).thenReturn(Optional.of(pendingBooking));
        when(reviewRepository.findByBookingId(501L)).thenReturn(Optional.empty());

        ReviewEligibilityResponse eligibility = reviewService.checkReviewEligibility(501L, "ramesh@example.com");

        assertFalse(eligibility.isEligible());
        assertFalse(eligibility.isAlreadyReviewed());
        assertTrue(eligibility.getMessage().contains("not completed"));
    }
}
