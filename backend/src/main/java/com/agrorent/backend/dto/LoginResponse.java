package com.agrorent.backend.dto;

/**
 * Login Response DTO containing JWT token and safe farmer profile.
 */
public class LoginResponse {

    private String token;
    private String tokenType = "Bearer";
    private long expiresInMs;
    private FarmerResponse farmer;

    public LoginResponse() {
    }

    public LoginResponse(String token, long expiresInMs, FarmerResponse farmer) {
        this.token = token;
        this.tokenType = "Bearer";
        this.expiresInMs = expiresInMs;
        this.farmer = farmer;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresInMs() {
        return expiresInMs;
    }

    public void setExpiresInMs(long expiresInMs) {
        this.expiresInMs = expiresInMs;
    }

    public FarmerResponse getFarmer() {
        return farmer;
    }

    public void setFarmer(FarmerResponse farmer) {
        this.farmer = farmer;
    }
}
