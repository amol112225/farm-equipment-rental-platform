/**
 * Equipment API Service
 * Handles REST requests to Spring Boot backend for Public Equipment search,
 * Farmer listing creation, updates, and deletion.
 */

import { API_BASE_URL, handleResponse } from './api';

/**
 * Fetch available equipment listings with optional filters.
 * @param {Object} params { keyword, category, location }
 * @returns {Promise<Object>} ApiResponse<List<EquipmentResponse>>
 */
export async function fetchPublicEquipment(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.keyword && params.keyword.trim()) {
    queryParams.append('keyword', params.keyword.trim());
  }
  if (params.category && params.category.trim() && params.category !== 'All Categories') {
    queryParams.append('category', params.category.trim());
  }
  if (params.location && params.location.trim()) {
    queryParams.append('location', params.location.trim());
  }

  const url = `${API_BASE_URL}/equipment${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(response);
}

/**
 * Fetch single equipment listing by ID.
 * @param {number|string} id
 * @returns {Promise<Object>} ApiResponse<EquipmentResponse>
 */
export async function fetchEquipmentById(id) {
  const response = await fetch(`${API_BASE_URL}/equipment/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(response);
}

/**
 * Fetch authenticated farmer's own listings (including unavailable).
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<List<EquipmentResponse>>
 */
export async function fetchMyEquipment(token) {
  const response = await fetch(`${API_BASE_URL}/equipment/my`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Create a new equipment listing as an authenticated farmer.
 * @param {Object} equipmentData
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<EquipmentResponse>
 */
export async function createEquipment(equipmentData, token) {
  const response = await fetch(`${API_BASE_URL}/equipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(equipmentData),
  });

  return handleResponse(response);
}

/**
 * Update an existing equipment listing owned by authenticated farmer.
 * @param {number|string} id
 * @param {Object} equipmentData
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<EquipmentResponse>
 */
export async function updateEquipment(id, equipmentData, token) {
  const response = await fetch(`${API_BASE_URL}/equipment/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(equipmentData),
  });

  return handleResponse(response);
}

/**
 * Delete an equipment listing owned by authenticated farmer.
 * @param {number|string} id
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export async function deleteEquipment(id, token) {
  const response = await fetch(`${API_BASE_URL}/equipment/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}
