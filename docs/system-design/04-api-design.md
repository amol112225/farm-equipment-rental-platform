# API Design

## Overview

The backend follows REST API principles and communicates with the frontend using JSON over HTTP.

All endpoints are versioned using `/api/v1` to support future updates without breaking existing clients.

---

## API Modules

- Authentication
- Users
- Equipment
- Categories
- Bookings
- Reviews
- Notifications

---

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | /api/v1/auth/register |
| POST | /api/v1/auth/login |
| POST | /api/v1/auth/logout |
| GET | /api/v1/auth/me |

---

## Users

| Method | Endpoint |
|---------|----------|
| GET | /api/v1/users/profile |
| PUT | /api/v1/users/profile |
| PUT | /api/v1/users/change-password |

---

## Equipment

| Method | Endpoint |
|---------|----------|
| GET | /api/v1/equipment |
| GET | /api/v1/equipment/:id |
| POST | /api/v1/equipment |
| PUT | /api/v1/equipment/:id |
| DELETE | /api/v1/equipment/:id |

Equipment search uses query parameters such as:

- category
- location
- bookingType
- minPrice
- maxPrice

---

## Bookings

| Method | Endpoint |
|---------|----------|
| POST | /api/v1/bookings |
| GET | /api/v1/bookings |
| GET | /api/v1/bookings/:id |
| PATCH | /api/v1/bookings/:id/cancel |
| PATCH | /api/v1/bookings/:id/accept |
| PATCH | /api/v1/bookings/:id/reject |

---

## Reviews

| Method | Endpoint |
|---------|----------|
| POST | /api/v1/reviews |
| GET | /api/v1/equipment/:id/reviews |

---

## Notifications

| Method | Endpoint |
|---------|----------|
| GET | /api/v1/notifications |
| PATCH | /api/v1/notifications/:id/read |

---

## Authentication

Protected endpoints require a valid JWT token.

Authorization header:

`Authorization: Bearer <token>`

---

## Standard Response Format

Success

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## HTTP Status Codes

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error