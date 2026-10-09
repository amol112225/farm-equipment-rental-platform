package com.agrorent.backend.service;

import com.agrorent.backend.dto.FarmerLoginRequest;
import com.agrorent.backend.dto.FarmerRegistrationRequest;
import com.agrorent.backend.dto.FarmerResponse;
import com.agrorent.backend.dto.LoginResponse;

/**
 * Service interface for Farmer operations.
 */
public interface FarmerService {

    FarmerResponse registerFarmer(FarmerRegistrationRequest request);

    LoginResponse loginFarmer(FarmerLoginRequest request);

    FarmerResponse getFarmerProfileByEmail(String email);
}
