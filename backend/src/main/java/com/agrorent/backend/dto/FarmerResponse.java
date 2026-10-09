package com.agrorent.backend.dto;

import java.time.LocalDateTime;

/**
 * Safe Farmer Profile Response DTO.
 * Excludes sensitive fields like password hashes.
 */
public class FarmerResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String village;
    private String district;
    private String state;
    private LocalDateTime createdAt;

    public FarmerResponse() {
    }

    public FarmerResponse(Long id, String fullName, String email, String phone, String village, String district, String state, LocalDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.village = village;
        this.district = district;
        this.state = state;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
