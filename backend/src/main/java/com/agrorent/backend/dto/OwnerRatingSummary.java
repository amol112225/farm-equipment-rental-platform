package com.agrorent.backend.dto;

/**
 * Summary DTO for aggregate equipment owner ratings.
 */
public class OwnerRatingSummary {

    private Long ownerId;
    private String ownerName;
    private Double averageRating;
    private Long totalReviews;

    public OwnerRatingSummary() {
    }

    public OwnerRatingSummary(Long ownerId, String ownerName, Double averageRating, Long totalReviews) {
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
    }

    public static OwnerRatingSummary empty(Long ownerId, String ownerName) {
        return new OwnerRatingSummary(ownerId, ownerName, 0.0, 0L);
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

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Long totalReviews) {
        this.totalReviews = totalReviews;
    }
}
