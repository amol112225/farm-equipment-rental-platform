/**
 * Authentication API Service
 * Handles REST requests to Spring Boot backend for Farmer Registration, Login, and Profile verification.
 */

import { API_BASE_URL, handleResponse } from './api';

/**
 * Register a new Farmer account.
 * @param {Object} farmerData { fullName, email, password, phone, village, district, state }
 * @returns {Promise<Object>} ApiResponse<FarmerResponse>
 */
export async function registerFarmer(farmerData) {
  const response = await fetch(`${API_BASE_URL}/farmers/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(farmerData),
  });

  return handleResponse(response);
}

/**
 * Authenticate Farmer credentials and obtain JWT Bearer Token.
 * @param {Object} credentials { email, password }
 * @returns {Promise<Object>} ApiResponse<LoginResponse>
 */
export async function loginFarmer(credentials) {
  const response = await fetch(`${API_BASE_URL}/farmers/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse(response);
}

/**
 * Fetch authenticated Farmer profile using JWT Bearer Token.
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<FarmerResponse>
 */
export async function getCurrentFarmer(token) {
  const response = await fetch(`${API_BASE_URL}/farmers/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}
