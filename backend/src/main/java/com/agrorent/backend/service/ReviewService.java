package com.agrorent.backend.service;

import com.agrorent.backend.dto.EquipmentRatingSummary;
import com.agrorent.backend.dto.OwnerRatingSummary;
import com.agrorent.backend.dto.ReviewCreateRequest;
import com.agrorent.backend.dto.ReviewEligibilityResponse;
import com.agrorent.backend.dto.ReviewResponse;

import java.util.List;

/**
 * Service interface for equipment owner reviews and ratings.
 */
public interface ReviewService {

    /**
     * Submit a rating and optional feedback for a completed booking.
     */
    ReviewResponse submitReview(ReviewCreateRequest request, String reviewerEmail);

    /**
     * Retrieve all reviews for a specific equipment item.
     */
    List<ReviewResponse> getReviewsByEquipment(Long equipmentId);

    /**
     * Retrieve the average rating and review count summary for a specific equipment item.
     */
    EquipmentRatingSummary getEquipmentRatingSummary(Long equipmentId);

    /**
     * Retrieve all reviews received by an equipment owner.
     */
    List<ReviewResponse> getReviewsByOwner(Long ownerId);

    /**
     * Retrieve the average rating and review count summary for an owner.
     */
    OwnerRatingSummary getOwnerRatingSummary(Long ownerId);

    /**
     * Check if the authenticated renter can submit a review for a specific booking.
     */
    ReviewEligibilityResponse checkReviewEligibility(Long bookingId, String reviewerEmail);

    /**
     * Retrieve the list of booking IDs already reviewed by the authenticated renter.
     */
    List<Long> getReviewedBookingIds(String reviewerEmail);
}
