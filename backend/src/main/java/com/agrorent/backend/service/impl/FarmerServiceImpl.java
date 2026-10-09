package com.agrorent.backend.service.impl;

import com.agrorent.backend.dto.FarmerLoginRequest;
import com.agrorent.backend.dto.FarmerRegistrationRequest;
import com.agrorent.backend.dto.FarmerResponse;
import com.agrorent.backend.dto.LoginResponse;
import com.agrorent.backend.exception.DuplicateResourceException;
import com.agrorent.backend.model.Farmer;
import com.agrorent.backend.repository.FarmerRepository;
import com.agrorent.backend.security.JwtTokenProvider;
import com.agrorent.backend.service.FarmerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Farmer Service Implementation.
 * Handles input normalization, duplicate verification, BCrypt hashing,
 * JWT authentication, and profile retrieval.
 */
@Service
public class FarmerServiceImpl implements FarmerService {

    private final FarmerRepository farmerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Autowired
    public FarmerServiceImpl(FarmerRepository farmerRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.farmerRepository = farmerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public FarmerResponse registerFarmer(FarmerRegistrationRequest request) {
        // 1. Input Normalization & Trimming
        String fullName = request.getFullName() != null ? request.getFullName().trim() : "";
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String normalizedPhone = request.getPhone() != null ? request.getPhone().trim() : "";
        String village = request.getVillage() != null ? request.getVillage().trim() : "";
        String district = request.getDistrict() != null ? request.getDistrict().trim() : "";
        String state = request.getState() != null ? request.getState().trim() : "";

        // 2. Duplicate Checks
        if (farmerRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("A farmer with email '" + normalizedEmail + "' already exists.");
        }

        if (farmerRepository.existsByPhone(normalizedPhone)) {
            throw new DuplicateResourceException(
                    "A farmer with phone number '" + normalizedPhone + "' already exists.");
        }

        // 3. BCrypt Password Hashing (Strength 10)
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 4. Create Entity & Save to Database
        Farmer farmer = new Farmer(
                fullName,
                normalizedEmail,
                hashedPassword,
                normalizedPhone,
                village,
                district,
                state);

        Farmer savedFarmer = farmerRepository.save(farmer);

        // 5. Map to Safe Response DTO (Omit Password Hash)
        return mapToResponse(savedFarmer);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse loginFarmer(FarmerLoginRequest request) {
        // 1. Normalize input email
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword() : "";

        // 2. Lookup farmer by email
        Optional<Farmer> farmerOptional = farmerRepository.findByEmail(normalizedEmail);

        // 3. Verify existence and BCrypt password match
        if (farmerOptional.isEmpty() || !passwordEncoder.matches(rawPassword, farmerOptional.get().getPassword())) {
            // Requirement 3: Unknown email and incorrect password MUST produce the exact
            // same generic 401 error
            throw new BadCredentialsException("Invalid email or password");
        }

        Farmer farmer = farmerOptional.get();

        // 4. Generate JWT Bearer Token
        String token = jwtTokenProvider.generateToken(farmer.getEmail());

        // 5. Return LoginResponse with token and safe FarmerResponse
        return new LoginResponse(
                token,
                jwtTokenProvider.getExpirationMs(),
                mapToResponse(farmer));
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerResponse getFarmerProfileByEmail(String email) {
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        Farmer farmer = farmerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Farmer profile not found"));

        return mapToResponse(farmer);
    }

    private FarmerResponse mapToResponse(Farmer farmer) {
        return new FarmerResponse(
                farmer.getId(),
                farmer.getFullName(),
                farmer.getEmail(),
                farmer.getPhone(),
                farmer.getVillage(),
                farmer.getDistrict(),
                farmer.getState(),
                farmer.getCreatedAt());
    }
}
