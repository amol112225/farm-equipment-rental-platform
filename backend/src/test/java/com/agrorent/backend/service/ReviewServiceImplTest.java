package com.agrorent.backend.service;

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
import com.agrorent.backend.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private Farmer renter;
    private Farmer owner;
    private Farmer otherUser;

    private Equipment equipmentA;
    private Equipment equipmentB;

    private Booking completedBookingA;
    private Booking completedBookingB;
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

        // Equipment A and Equipment B both belong to the SAME owner
        equipmentA = new Equipment();
        equipmentA.setId(101L);
        equipmentA.setName("Equipment A - Mahindra Tractor");
        equipmentA.setCategory("Tractor");
        equipmentA.setOwner(owner);

        equipmentB = new Equipment();
        equipmentB.setId(102L);
        equipmentB.setName("Equipment B - Rotavator");
        equipmentB.setCategory("Implement");
        equipmentB.setOwner(owner);

        // Completed booking for Equipment A
        completedBookingA = new Booking();
        completedBookingA.setId(500L);
        completedBookingA.setEquipment(equipmentA);
        completedBookingA.setRenter(renter);
        completedBookingA.setOwner(owner);
        completedBookingA.setStatus("COMPLETED");
        completedBookingA.setStartDateTime(LocalDateTime.now().minusDays(3));
        completedBookingA.setEndDateTime(LocalDateTime.now().minusDays(2));
        completedBookingA.setDuration(24);
        completedBookingA.setPriceUnit("hour");
        completedBookingA.setRateSnapshot(new BigDecimal("600.00"));
        completedBookingA.setTotalPrice(new BigDecimal("14400.00"));

        // Completed booking for Equipment B
        completedBookingB = new Booking();
        completedBookingB.setId(505L);
        completedBookingB.setEquipment(equipmentB);
        completedBookingB.setRenter(renter);
        completedBookingB.setOwner(owner);
        completedBookingB.setStatus("COMPLETED");
        completedBookingB.setStartDateTime(LocalDateTime.now().minusDays(5));
        completedBookingB.setEndDateTime(LocalDateTime.now().minusDays(4));
        completedBookingB.setDuration(8);
        completedBookingB.setPriceUnit("hour");
        completedBookingB.setRateSnapshot(new BigDecimal("300.00"));
        completedBookingB.setTotalPrice(new BigDecimal("2400.00"));

        // Pending booking for Equipment A
        pendingBooking = new Booking();
        pendingBooking.setId(501L);
        pendingBooking.setEquipment(equipmentA);
        pendingBooking.setRenter(renter);
        pendingBooking.setOwner(owner);
        pendingBooking.setStatus("PENDING");
    }

    @Test
    @DisplayName("Requirement 1 & 2: Renter submits review for completed booking of Equipment A; backend derives equipment and owner")
    void testRenterCanReviewCompletedBookingOfEquipmentA() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 5, "Great tractor, worked very smoothly!");

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBookingA));
        when(reviewRepository.existsByBookingId(500L)).thenReturn(false);

        Review savedReview = new Review(completedBookingA, equipmentA, renter, owner, 5, "Great tractor, worked very smoothly!");
        savedReview.setId(1L);
        savedReview.setCreatedAt(LocalDateTime.now());
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);

        ReviewResponse response = reviewService.submitReview(request, "ramesh@example.com");

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(500L, response.getBookingId());
        assertEquals(101L, response.getEquipmentId());
        assertEquals("Equipment A - Mahindra Tractor", response.getEquipmentName());
        assertEquals(20L, response.getOwnerId());
        assertEquals("Suresh Gowda", response.getOwnerName());
        assertEquals(5, response.getRating());
        assertEquals("Great tractor, worked very smoothly!", response.getFeedback());

        // Verify that the saved Review entity had the booking's equipment and owner set
        ArgumentCaptor<Review> captor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(captor.capture());
        Review captured = captor.getValue();
        assertEquals(101L, captured.getEquipment().getId());
        assertEquals(20L, captured.getOwner().getId());
    }

    @Test
    @DisplayName("Requirements 3 & 4: Equipment A rating summary includes its review; Equipment B rating summary does NOT")
    void testEquipmentRatingSummaryIsolationBetweenEquipmentOfSameOwner() {
        // Equipment A and B belong to the same owner
        assertEquals(equipmentA.getOwner().getId(), equipmentB.getOwner().getId());

        when(equipmentRepository.findById(101L)).thenReturn(Optional.of(equipmentA));
        when(equipmentRepository.findById(102L)).thenReturn(Optional.of(equipmentB));

        // Equipment A has 1 review with 5.0 rating
        when(reviewRepository.countByEquipmentId(101L)).thenReturn(1L);
        when(reviewRepository.getAverageRatingByEquipmentId(101L)).thenReturn(5.0);

        // Equipment B has 0 reviews
        when(reviewRepository.countByEquipmentId(102L)).thenReturn(0L);

        EquipmentRatingSummary summaryA = reviewService.getEquipmentRatingSummary(101L);
        EquipmentRatingSummary summaryB = reviewService.getEquipmentRatingSummary(102L);

        // Equipment A includes the review
        assertNotNull(summaryA);
        assertEquals(101L, summaryA.getEquipmentId());
        assertEquals("Equipment A - Mahindra Tractor", summaryA.getEquipmentName());
        assertEquals(5.0, summaryA.getAverageRating());
        assertEquals(1L, summaryA.getTotalReviews());

        // Equipment B does NOT include the review
        assertNotNull(summaryB);
        assertEquals(102L, summaryB.getEquipmentId());
        assertEquals("Equipment B - Rotavator", summaryB.getEquipmentName());
        assertEquals(0.0, summaryB.getAverageRating());
        assertEquals(0L, summaryB.getTotalReviews());

        verify(reviewRepository).countByEquipmentId(101L);
        verify(reviewRepository).countByEquipmentId(102L);
        verify(reviewRepository, never()).countByOwnerId(anyLong());
    }

    @Test
    @DisplayName("Requirements 5 & 6: Equipment A review list contains feedback; Equipment B review list does NOT")
    void testEquipmentReviewListIsolationBetweenEquipmentOfSameOwner() {
        Review reviewForA = new Review(completedBookingA, equipmentA, renter, owner, 5, "Mahindra worked great!");
        reviewForA.setId(1L);
        reviewForA.setCreatedAt(LocalDateTime.now());

        when(equipmentRepository.existsById(101L)).thenReturn(true);
        when(equipmentRepository.existsById(102L)).thenReturn(true);

        when(reviewRepository.findByEquipmentIdOrderByCreatedAtDesc(101L)).thenReturn(List.of(reviewForA));
        when(reviewRepository.findByEquipmentIdOrderByCreatedAtDesc(102L)).thenReturn(Collections.emptyList());

        List<ReviewResponse> listA = reviewService.getReviewsByEquipment(101L);
        List<ReviewResponse> listB = reviewService.getReviewsByEquipment(102L);

        // Equipment A review list has the review and feedback
        assertEquals(1, listA.size());
        assertEquals("Mahindra worked great!", listA.get(0).getFeedback());
        assertEquals(101L, listA.get(0).getEquipmentId());

        // Equipment B review list is empty and does NOT contain Equipment A's feedback
        assertTrue(listB.isEmpty());

        verify(reviewRepository).findByEquipmentIdOrderByCreatedAtDesc(101L);
        verify(reviewRepository).findByEquipmentIdOrderByCreatedAtDesc(102L);
    }

    @Test
    @DisplayName("Requirement 7: Owner-wide review list includes reviews for both items without misattributing")
    void testOwnerWideReviewsIncludesBothWithoutMisattributing() {
        Review reviewForA = new Review(completedBookingA, equipmentA, renter, owner, 5, "Mahindra worked great!");
        reviewForA.setId(1L);
        reviewForA.setCreatedAt(LocalDateTime.now());

        Review reviewForB = new Review(completedBookingB, equipmentB, renter, owner, 4, "Rotavator was sharp.");
        reviewForB.setId(2L);
        reviewForB.setCreatedAt(LocalDateTime.now().minusHours(1));

        when(farmerRepository.existsById(20L)).thenReturn(true);
        when(reviewRepository.findByOwnerIdOrderByCreatedAtDesc(20L)).thenReturn(List.of(reviewForA, reviewForB));

        List<ReviewResponse> ownerReviews = reviewService.getReviewsByOwner(20L);

        assertEquals(2, ownerReviews.size());

        // First review is clearly for Equipment A
        assertEquals(101L, ownerReviews.get(0).getEquipmentId());
        assertEquals("Equipment A - Mahindra Tractor", ownerReviews.get(0).getEquipmentName());
        assertEquals("Mahindra worked great!", ownerReviews.get(0).getFeedback());

        // Second review is clearly for Equipment B
        assertEquals(102L, ownerReviews.get(1).getEquipmentId());
        assertEquals("Equipment B - Rotavator", ownerReviews.get(1).getEquipmentName());
        assertEquals("Rotavator was sharp.", ownerReviews.get(1).getFeedback());
    }

    @Test
    @DisplayName("Requirement 8: Review cannot be submitted with mismatched/unrelated equipment ID")
    void testReviewCannotBeSubmittedForUnrelatedEquipment() {
        // Booking 500 is for Equipment A (ID 101), but request specifies Equipment B (ID 102)
        ReviewCreateRequest mismatchedRequest = new ReviewCreateRequest(500L, 5, "Nice equipment");
        mismatchedRequest.setEquipmentId(102L);

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBookingA));
        when(reviewRepository.existsByBookingId(500L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                reviewService.submitReview(mismatchedRequest, "ramesh@example.com")
        );

        assertTrue(ex.getMessage().contains("does not match the equipment rented"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Requirement 9a: Renter cannot review an incomplete booking (PENDING/APPROVED)")
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
    @DisplayName("Requirement 9b: User cannot review another renter's booking")
    void testUserCannotReviewAnotherRentersBooking() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 5, "Not my booking");

        when(farmerRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBookingA));

        UnauthorizedActionException ex = assertThrows(UnauthorizedActionException.class, () ->
                reviewService.submitReview(request, "other@example.com")
        );

        assertTrue(ex.getMessage().contains("not authorized"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Requirement 9c: Duplicate reviews are rejected before saving")
    void testDuplicateReviewRejected() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 4, "Submitting second time");

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBookingA));
        when(reviewRepository.existsByBookingId(500L)).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                reviewService.submitReview(request, "ramesh@example.com")
        );

        assertTrue(ex.getMessage().contains("already been submitted"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Requirement 9d: Concurrent duplicate review hitting database constraint is caught")
    void testConcurrentDuplicateReviewHandled() {
        ReviewCreateRequest request = new ReviewCreateRequest(500L, 4, "Concurrent submission");

        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBookingA));
        when(reviewRepository.existsByBookingId(500L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenThrow(new DataIntegrityViolationException("uk_reviews_booking_id"));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                reviewService.submitReview(request, "ramesh@example.com")
        );

        assertTrue(ex.getMessage().contains("already been submitted"));
    }

    @Test
    @DisplayName("Ratings below 1 or above 5 are rejected")
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
    @DisplayName("Owner rating summary still works accurately across owner's entire equipment fleet")
    void testOwnerRatingAverageAndCountCalculatedCorrectly() {
        when(farmerRepository.findById(20L)).thenReturn(Optional.of(owner));
        when(reviewRepository.countByOwnerId(20L)).thenReturn(2L);
        when(reviewRepository.getAverageRatingByOwnerId(20L)).thenReturn(4.5);

        OwnerRatingSummary summary = reviewService.getOwnerRatingSummary(20L);

        assertNotNull(summary);
        assertEquals(20L, summary.getOwnerId());
        assertEquals("Suresh Gowda", summary.getOwnerName());
        assertEquals(2L, summary.getTotalReviews());
        assertEquals(4.5, summary.getAverageRating());
    }

    @Test
    @DisplayName("Check review eligibility: Eligible completed booking")
    void testCheckReviewEligibilityEligible() {
        when(farmerRepository.findByEmail("ramesh@example.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBookingA));
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
        when(bookingRepository.findById(500L)).thenReturn(Optional.of(completedBookingA));
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
