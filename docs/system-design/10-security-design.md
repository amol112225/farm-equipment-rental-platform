# Security Design

## Overview

Security is an important part of the Farm Equipment Rental Platform. The application follows basic security practices to protect user accounts and data.

---

## Authentication

- JWT-based authentication
- JWT stored in HttpOnly Cookie
- Protected routes using authentication middleware

---

## Password Security

- Passwords are hashed using bcrypt.
- Plain-text passwords are never stored in the database.

---

## Authorization

Users can only access resources they own.

Examples:

- Users can edit only their own equipment.
- Users can cancel only their own bookings.
- Equipment owners can only manage bookings for their own equipment.

---

## Input Validation

All incoming requests are validated before processing.

Examples:

- Required fields
- Email format validation
- Phone number validation
- Price must be greater than zero
- Booking dates must be valid

---

## API Security

- Protected APIs require authentication.
- Unauthorized requests return HTTP 401.
- Forbidden actions return HTTP 403.

---

## Database Security

- Parameterized queries / ORM to prevent SQL Injection.
- Foreign key constraints maintain data integrity.

---

## CORS

Only trusted frontend applications are allowed to access the backend APIs.

---

## Environment Variables

Sensitive information is stored in environment variables.

Examples:

- Database URL
- JWT Secret
- Cloudinary Keys
- Email Credentials

---

## Future Improvements

- Rate Limiting
- Refresh Tokens
- Two-Factor Authentication (2FA)
- Email Verification
- Password Reseti 