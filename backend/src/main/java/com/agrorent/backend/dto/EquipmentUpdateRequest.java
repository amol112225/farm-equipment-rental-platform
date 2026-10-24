package com.agrorent.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class EquipmentUpdateRequest {

    @NotBlank(message = "Equipment name is required")
    @Size(max = 150, message = "Equipment name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must not exceed 50 characters")
    private String category;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be a positive value greater than zero")
    private BigDecimal price;

    @NotBlank(message = "Price unit is required")
    @Pattern(regexp = "^(?i)(hour|day)$", message = "Price unit must be either 'hour' or 'day'")
    private String priceUnit;

    @NotBlank(message = "Booking type is required")
    @Pattern(regexp = "^(?i)(instant|request|both)$", message = "Booking type must be 'instant', 'request', or 'both'")
    private String bookingType;

    @NotBlank(message = "Location is required")
    @Size(max = 200, message = "Location must not exceed 200 characters")
    private String location;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    private Long primaryImageId;

    private Boolean isAvailable;

    public EquipmentUpdateRequest() {
    }

    public EquipmentUpdateRequest(String name, String category, String description, BigDecimal price, String priceUnit, String bookingType, String location, String imageUrl, Boolean isAvailable) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.price = price;
        this.priceUnit = priceUnit;
        this.bookingType = bookingType;
        this.location = location;
        this.imageUrl = imageUrl;
        this.isAvailable = isAvailable;
    }

    public EquipmentUpdateRequest(String name, String category, String description, BigDecimal price, String priceUnit, String bookingType, String location, String imageUrl, Long primaryImageId, Boolean isAvailable) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.price = price;
        this.priceUnit = priceUnit;
        this.bookingType = bookingType;
        this.location = location;
        this.imageUrl = imageUrl;
        this.primaryImageId = primaryImageId;
        this.isAvailable = isAvailable;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getPriceUnit() {
        return priceUnit;
    }

    public void setPriceUnit(String priceUnit) {
        this.priceUnit = priceUnit;
    }

    public String getBookingType() {
        return bookingType;
    }

    public void setBookingType(String bookingType) {
        this.bookingType = bookingType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Long getPrimaryImageId() {
        return primaryImageId;
    }

    public void setPrimaryImageId(Long primaryImageId) {
        this.primaryImageId = primaryImageId;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }
}
