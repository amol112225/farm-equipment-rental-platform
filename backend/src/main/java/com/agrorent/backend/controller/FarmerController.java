package com.agrorent.backend.controller;

import com.agrorent.backend.dto.ApiResponse;
import com.agrorent.backend.dto.FarmerLoginRequest;
import com.agrorent.backend.dto.FarmerRegistrationRequest;
import com.agrorent.backend.dto.FarmerResponse;
import com.agrorent.backend.dto.LoginResponse;
import com.agrorent.backend.service.FarmerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * Farmer Controller handling registration, login, and profile REST API requests.
 */
@RestController
@RequestMapping("/api/farmers")
public class FarmerController {

    private final FarmerService farmerService;

    @Autowired
    public FarmerController(FarmerService farmerService) {
        this.farmerService = farmerService;
    }

    /**
     * POST /api/farmers/register
     * Registers a new farmer account with input validation and BCrypt password hashing.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<FarmerResponse>> registerFarmer(@Valid @RequestBody FarmerRegistrationRequest request) {
        FarmerResponse registeredFarmer = farmerService.registerFarmer(request);
        ApiResponse<FarmerResponse> response = ApiResponse.success("Farmer account registered successfully", registeredFarmer);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/farmers/login
     * Authenticates farmer with email/password and returns a JWT Bearer token on success.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> loginFarmer(@Valid @RequestBody FarmerLoginRequest request) {
        LoginResponse loginResponse = farmerService.loginFarmer(request);
        ApiResponse<LoginResponse> response = ApiResponse.success("Login successful", loginResponse);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/farmers/me
     * Obtains identity strictly from the authenticated SecurityContext Principal.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<FarmerResponse>> getCurrentFarmerProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        FarmerResponse profile = farmerService.getFarmerProfileByEmail(principal.getName());
        ApiResponse<FarmerResponse> response = ApiResponse.success("Farmer profile retrieved successfully", profile);
        return ResponseEntity.ok(response);
    }
}

