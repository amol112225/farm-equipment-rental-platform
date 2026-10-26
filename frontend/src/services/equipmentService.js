/**
 * Equipment API Service
 * Handles REST requests to Spring Boot backend for Public Equipment search,
 * Farmer listing creation, updates, photo uploads, and deletion.
 */

import { API_BASE_URL, handleResponse } from './api';

/**
 * Resolves an image URL or relative path to a full accessible URL.
 * Handles Cloudinary/external HTTPS URLs as well as backend relative upload paths.
 * @param {string} url - Image URL or relative path
 * @returns {string|null} - Resolved full URL or null if empty
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const backendRoot = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendRoot}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

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
 * Upload an equipment image to the backend and obtain its hosted URL.
 * Uses FormData and multipart/form-data. Does not set Content-Type header
 * to allow the browser to generate the multipart boundary automatically.
 * @param {File} file - Image file (JPEG, PNG, WebP)
 * @param {string} token - Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<ImageUploadResponse> ({ data: { imageUrl } })
 */
export async function uploadEquipmentImage(file, token) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/equipment/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return handleResponse(response);
}

/**
 * Create a new equipment listing as an authenticated farmer.
 * Supports both JSON object and FormData (multipart for photo attachments).
 * @param {Object|FormData} equipmentData
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<EquipmentResponse>
 */
export async function createEquipment(equipmentData, token) {
  const isFormData = typeof FormData !== 'undefined' && equipmentData instanceof FormData;
  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}/equipment`, {
    method: 'POST',
    headers,
    body: isFormData ? equipmentData : JSON.stringify(equipmentData),
  });

  return handleResponse(response);
}

/**
 * Upload one or multiple photos to an existing equipment listing.
 * @param {number|string} equipmentId
 * @param {File[]|FileList|File} files
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<EquipmentResponse>
 */
export async function uploadEquipmentPhotos(equipmentId, files, token) {
  const formData = new FormData();
  const fileArray = Array.isArray(files) ? files : Array.from(files);
  fileArray.forEach((file) => {
    formData.append('photos', file);
  });

  const response = await fetch(`${API_BASE_URL}/equipment/${equipmentId}/photos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return handleResponse(response);
}

/**
 * Delete a specific photo from an equipment listing.
 * @param {number|string} equipmentId
 * @param {number|string} photoId
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<EquipmentResponse>
 */
export async function deleteEquipmentPhoto(equipmentId, photoId, token) {
  const response = await fetch(`${API_BASE_URL}/equipment/${equipmentId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Designate a photo as the primary cover photo for the listing.
 * @param {number|string} equipmentId
 * @param {number|string} photoId
 * @param {string} token Bearer JWT Token
 * @returns {Promise<Object>} ApiResponse<EquipmentResponse>
 */
export async function setPrimaryEquipmentPhoto(equipmentId, photoId, token) {
  const response = await fetch(`${API_BASE_URL}/equipment/${equipmentId}/photos/${photoId}/primary`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
