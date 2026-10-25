/**
 * AgroRent Frontend - Centralized API Configuration & Response Handling
 *
 * Configures the base URL for REST API communication with the Spring Boot backend.
 * Uses Vite environment variable VITE_API_BASE_URL with fallback to local development.
 */

const rawBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
).trim().replace(/\/+$/, '');

export const API_BASE_URL = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl
  : `${rawBaseUrl}/api`;

/**
 * Standardized HTTP response parser and error transformer.
 * Unifies API error handling across all frontend service modules.
 *
 * @param {Response} response - Fetch API Response object
 * @returns {Promise<any>} - Parsed JSON response body
 * @throws {Error} - Standardized Error with response status and backend field errors
 */
export async function handleResponse(response) {
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
