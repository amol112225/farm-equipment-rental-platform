/**
 * Booking API Service
 * Handles REST requests to Spring Boot backend for equipment rental bookings,
 * renter booking retrieval, cancellation, and advisory availability checks.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Helper to handle HTTP response parsing and error throwing.
 */
async function handleResponse(response) {
  let json;
  try {
    json = await response.json();
  } catch (e) {
    json = null;
  }

  if (!response.ok) {
    const errorMsg = json?.message || `Server error (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.errors = json?.errors || null;
    throw error;
  }

  return json;
}

/**
 * Create a new equipment rental booking request.
 * @param {Object} data { equipmentId, startDateTime, duration, notes, bookingMode }
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<BookingResponse>
 */
export async function createBooking(data, token) {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

/**
 * Fetch all bookings created by the authenticated farmer.
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<List<BookingResponse>>
 */
export async function fetchMyBookings(token) {
  const response = await fetch(`${API_BASE_URL}/bookings/my`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Fetch single booking details by ID owned by the renter.
 * @param {number|string} id
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<BookingResponse>
 */
export async function fetchBookingById(id, token) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Cancel an active or pending booking owned by the renter.
 * @param {number|string} id
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<BookingResponse>
 */
export async function cancelBooking(id, token) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Advisory check for equipment availability during a given time period.
 * @param {number|string} equipmentId
 * @param {string} startDateTime ISO string
 * @param {number} duration
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<{ equipmentId, available }>
 */
export async function checkAvailability(equipmentId, startDateTime, duration, token) {
  const queryParams = new URLSearchParams({
    equipmentId: equipmentId.toString(),
    startDateTime: startDateTime,
    duration: duration.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/bookings/check-availability?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Fetch all equipment bookings owned by the authenticated farmer.
 * @param {string} token Bearer JWT token
 * @param {string} [statusFilter] Optional status filter (e.g. 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')
 * @returns {Promise<Object>} ApiResponse<List<BookingResponse>>
 */
export async function fetchOwnerBookings(token, statusFilter) {
  let url = `${API_BASE_URL}/bookings/owner`;
  if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
    url += `?status=${encodeURIComponent(statusFilter.toUpperCase())}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Fetch single booking details by ID owned by the equipment owner.
 * @param {number|string} id
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<BookingResponse>
 */
export async function fetchOwnerBookingById(id, token) {
  const response = await fetch(`${API_BASE_URL}/bookings/owner/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Approve a pending rental booking for equipment owned by the authenticated farmer.
 * @param {number|string} id
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<BookingResponse>
 */
export async function approveOwnerBooking(id, token) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Reject a pending rental booking for equipment owned by the authenticated farmer.
 * @param {number|string} id
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<BookingResponse>
 */
export async function rejectOwnerBooking(id, token) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Mark an approved rental booking as completed for equipment owned by the authenticated farmer.
 * @param {number|string} id
 * @param {string} token Bearer JWT token
 * @returns {Promise<Object>} ApiResponse<BookingResponse>
 */
export async function completeOwnerBooking(id, token) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/complete`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

