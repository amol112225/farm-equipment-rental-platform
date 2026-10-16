package com.agrorent.backend.controller;

import com.agrorent.backend.dto.ApiResponse;
import com.agrorent.backend.dto.EquipmentRatingSummary;
import com.agrorent.backend.dto.OwnerRatingSummary;
import com.agrorent.backend.dto.ReviewCreateRequest;
import com.agrorent.backend.dto.ReviewEligibilityResponse;
import com.agrorent.backend.dto.ReviewResponse;
import com.agrorent.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

/**
 * REST Controller for Equipment and Owner Ratings and Reviews.
 * Handles review submissions, eligibility checks, equipment-specific and owner-wide review endpoints.
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @Autowired
    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * Submit a star rating and optional feedback for a completed booking.
     * POST /api/reviews
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            @Valid @RequestBody ReviewCreateRequest request,
            Principal principal) {
        ReviewResponse response = reviewService.submitReview(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review submitted successfully", response));
    }

    /**
     * Retrieve all reviews for a specific equipment item.
     * Public endpoint.
     * GET /api/reviews/equipment/{equipmentId}
     */
    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getEquipmentReviews(@PathVariable Long equipmentId) {
        List<ReviewResponse> reviews = reviewService.getReviewsByEquipment(equipmentId);
        return ResponseEntity.ok(ApiResponse.success("Equipment reviews retrieved successfully", reviews));
    }

    /**
     * Retrieve rating summary (average score and review count) for a specific equipment item.
     * Public endpoint.
     * GET /api/reviews/equipment/{equipmentId}/summary
     */
    @GetMapping("/equipment/{equipmentId}/summary")
    public ResponseEntity<ApiResponse<EquipmentRatingSummary>> getEquipmentRatingSummary(@PathVariable Long equipmentId) {
        EquipmentRatingSummary summary = reviewService.getEquipmentRatingSummary(equipmentId);
        return ResponseEntity.ok(ApiResponse.success("Equipment rating summary retrieved successfully", summary));
    }

    /**
     * Retrieve all reviews received by a specific equipment owner across all their listings.
     * Public endpoint.
     * GET /api/reviews/owner/{ownerId}
     */
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getOwnerReviews(@PathVariable Long ownerId) {
        List<ReviewResponse> reviews = reviewService.getReviewsByOwner(ownerId);
        return ResponseEntity.ok(ApiResponse.success("Owner reviews retrieved successfully", reviews));
    }

    /**
     * Retrieve rating summary (average score and review count) for an equipment owner.
     * Public endpoint.
     * GET /api/reviews/owner/{ownerId}/summary`
     */
    @GetMapping("/owner/{ownerId}/summary")
    public ResponseEntity<ApiResponse<OwnerRatingSummary>> getOwnerRatingSummary(@PathVariable Long ownerId) {
        OwnerRatingSummary summary = reviewService.getOwnerRatingSummary(ownerId);
        return ResponseEntity.ok(ApiResponse.success("Owner rating summary retrieved successfully", summary));
    }

    /**
     * Check if the authenticated renter can submit a review for a specific booking.
     * Protected endpoint.
     * GET /api/reviews/eligibility/{bookingId}
     */
    @GetMapping("/eligibility/{bookingId}")
    public ResponseEntity<ApiResponse<ReviewEligibilityResponse>> checkReviewEligibility(
            @PathVariable Long bookingId,
            Principal principal) {
        ReviewEligibilityResponse response = reviewService.checkReviewEligibility(bookingId, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Review eligibility checked successfully", response));
    }

    /**
     * Retrieve the list of booking IDs already reviewed by the authenticated renter.
     * Protected endpoint.
     * GET /api/reviews/my/reviewed-booking-ids
     */
    @GetMapping("/my/reviewed-booking-ids")
    public ResponseEntity<ApiResponse<List<Long>>> getMyReviewedBookingIds(Principal principal) {
        List<Long> reviewedBookingIds = reviewService.getReviewedBookingIds(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Reviewed booking IDs retrieved successfully", reviewedBookingIds));
    }
}
