package com.agrorent.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for submitting an owner review on a completed booking.
 */
public class ReviewCreateRequest {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    private Long equipmentId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5 stars")
    @Max(value = 5, message = "Rating must be between 1 and 5 stars")
    private Integer rating;

    @Size(max = 1000, message = "Feedback must not exceed 1000 characters")
    private String feedback;

    public ReviewCreateRequest() {
    }

    public ReviewCreateRequest(Long bookingId, Integer rating, String feedback) {
        this(bookingId, null, rating, feedback);
    }

    public ReviewCreateRequest(Long bookingId, Long equipmentId, Integer rating, String feedback) {
        this.bookingId = bookingId;
        this.equipmentId = equipmentId;
        this.rating = rating;
        this.feedback = feedback;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getEquipmentId() {
        return equipmentId;
    }

    public void setEquipmentId(Long equipmentId) {
        this.equipmentId = equipmentId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
