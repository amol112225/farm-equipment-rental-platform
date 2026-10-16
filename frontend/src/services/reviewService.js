import { API_BASE_URL, handleResponse } from './api';

/**
 * Service module for Owner Ratings & Reviews API communication.
 */

// Memory cache for owner rating summaries to avoid duplicate requests across equipment cards
const ownerRatingCache = new Map();

/**
 * Submit a star rating and optional feedback for a completed booking.
 *
 * @param {Object} payload - { bookingId: number, rating: number, feedback?: string }
 * @param {string} token - Authenticated renter JWT token
 * @returns {Promise<any>}
 */
export async function submitReview(payload, token) {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await handleResponse(response);
  // Invalidate cache for this owner if cached
  if (json?.data?.ownerId) {
    ownerRatingCache.delete(json.data.ownerId);
  } else {
    ownerRatingCache.clear();
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('agrorent:review-submitted', {
        detail: { ownerId: json?.data?.ownerId, bookingId: payload?.bookingId },
      })
    );
  }

  return json;
}

/**
 * Fetch all reviews received by a specific equipment owner.
 *
 * @param {number} ownerId
 * @returns {Promise<any>}
 */
export async function fetchOwnerReviews(ownerId) {
  const response = await fetch(`${API_BASE_URL}/reviews/owner/${ownerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(response);
}

/**
 * Fetch rating summary (average score and total reviews) for an equipment owner.
 *
 * @param {number} ownerId
 * @param {boolean} [useCache=true]
 * @returns {Promise<any>}
 */
export async function fetchOwnerRatingSummary(ownerId, useCache = true) {
  if (useCache && ownerRatingCache.has(ownerId)) {
    return ownerRatingCache.get(ownerId);
  }

  const promise = fetch(`${API_BASE_URL}/reviews/owner/${ownerId}/summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(handleResponse)
    .catch((err) => {
      ownerRatingCache.delete(ownerId);
      throw err;
    });

  if (useCache) {
    ownerRatingCache.set(ownerId, promise);
  }

  return promise;
}

/**
 * Check review eligibility for a specific booking.
 *
 * @param {number} bookingId
 * @param {string} token
 * @returns {Promise<any>}
 */
export async function checkReviewEligibility(bookingId, token) {
  const response = await fetch(`${API_BASE_URL}/reviews/eligibility/${bookingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

/**
 * Retrieve list of booking IDs already reviewed by the authenticated renter.
 *
 * @param {string} token
 * @returns {Promise<any>}
 */
export async function fetchMyReviewedBookingIds(token) {
  const response = await fetch(`${API_BASE_URL}/reviews/my/reviewed-booking-ids`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}
