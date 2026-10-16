package com.agrorent.backend.dto;

/**
 * Summary DTO for aggregate equipment ratings.
 */
public class EquipmentRatingSummary {

    private Long equipmentId;
    private String equipmentName;
    private Double averageRating;
    private Long totalReviews;
    private Long ownerId;
    private String ownerName;

    public EquipmentRatingSummary() {
    }

    public EquipmentRatingSummary(Long equipmentId, String equipmentName, Double averageRating, Long totalReviews) {
        this(equipmentId, equipmentName, averageRating, totalReviews, null, null);
    }

    public EquipmentRatingSummary(Long equipmentId, String equipmentName, Double averageRating, Long totalReviews, Long ownerId, String ownerName) {
        this.equipmentId = equipmentId;
        this.equipmentName = equipmentName;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
    }

    public static EquipmentRatingSummary empty(Long equipmentId, String equipmentName) {
        return new EquipmentRatingSummary(equipmentId, equipmentName, 0.0, 0L);
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
}
