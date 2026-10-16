package com.agrorent.backend.dto;

/**
 * DTO for checking review eligibility on a booking for the current renter.
 */
public class ReviewEligibilityResponse {

    private Long bookingId;
    private boolean eligible;
    private boolean alreadyReviewed;
    private String message;
    private Long reviewId;

    public ReviewEligibilityResponse() {
    }

    public ReviewEligibilityResponse(Long bookingId, boolean eligible, boolean alreadyReviewed, String message, Long reviewId) {
        this.bookingId = bookingId;
        this.eligible = eligible;
        this.alreadyReviewed = alreadyReviewed;
        this.message = message;
        this.reviewId = reviewId;
    }

    public static ReviewEligibilityResponse eligible(Long bookingId) {
        return new ReviewEligibilityResponse(bookingId, true, false, "Booking is eligible for review", null);
    }

    public static ReviewEligibilityResponse alreadyReviewed(Long bookingId, Long reviewId) {
        return new ReviewEligibilityResponse(bookingId, false, true, "Booking has already been reviewed", reviewId);
    }

    public static ReviewEligibilityResponse ineligible(Long bookingId, String reason) {
        return new ReviewEligibilityResponse(bookingId, false, false, reason, null);
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public boolean isAlreadyReviewed() {
        return alreadyReviewed;
    }

    public void setAlreadyReviewed(boolean alreadyReviewed) {
        this.alreadyReviewed = alreadyReviewed;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getReviewId() {
        return reviewId;
    }

    public void setReviewId(Long reviewId) {
        this.reviewId = reviewId;
    }
}
