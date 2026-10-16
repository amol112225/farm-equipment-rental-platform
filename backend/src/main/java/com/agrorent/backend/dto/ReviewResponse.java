package com.agrorent.backend.dto;

import java.time.LocalDateTime;

/**
 * Safe Response DTO for reviews.
 * Does NOT expose sensitive user credentials like passwords, JWT tokens, emails, or phone numbers.
 */
public class ReviewResponse {

    private Long id;
    private Long bookingId;
    private Long equipmentId;
    private String equipmentName;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerLocation;
    private Long ownerId;
    private String ownerName;
    private Integer rating;
    private String feedback;
    private LocalDateTime createdAt;

    public ReviewResponse() {
    }

    public ReviewResponse(Long id, Long bookingId, Long equipmentId, String equipmentName,
                          Long reviewerId, String reviewerName, String reviewerLocation,
                          Long ownerId, String ownerName, Integer rating, String feedback,
                          LocalDateTime createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.equipmentId = equipmentId;
        this.equipmentName = equipmentName;
        this.reviewerId = reviewerId;
        this.reviewerName = reviewerName;
        this.reviewerLocation = reviewerLocation;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.rating = rating;
        this.feedback = feedback;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getEquipmentName() {
        return equipmentName;
    }

    public void setEquipmentName(String equipmentName) {
        this.equipmentName = equipmentName;
    }

    public Long getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(Long reviewerId) {
        this.reviewerId = reviewerId;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    public String getReviewerLocation() {
        return reviewerLocation;
    }

    public void setReviewerLocation(String reviewerLocation) {
        this.reviewerLocation = reviewerLocation;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
