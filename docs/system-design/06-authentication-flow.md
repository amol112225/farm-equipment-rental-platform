# Authentication Flow

## Overview

The platform uses JWT-based authentication to secure protected resources.

Authentication verifies the identity of users, while authorization controls what actions they can perform.

---

## Authentication Process

1. User registers an account.
2. User logs in using email and password.
3. Backend verifies credentials.
4. A JWT is generated.
5. The JWT is stored in an HttpOnly Cookie.
6. Protected requests include the cookie automatically.
7. JWT middleware validates the token before processing the request.

---

## Authorization

Permissions depend on the authenticated user's role.

Examples:

- Guests can browse equipment.
- Logged-in users can create bookings.
- Equipment owners can manage only their own equipment.
- Admin features are reserved for future versions.

---

## Protected Routes

Examples:

- Dashboard
- Profile
- Add Equipment
- Book Equipment
- Booking History

---

## Security Decisions

- JWT Authentication
- HttpOnly Cookies
- Password Hashing (bcrypt)
- Route Protection using Middleware