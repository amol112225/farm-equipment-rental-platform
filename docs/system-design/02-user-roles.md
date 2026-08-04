# User Roles & Permissions

## User Types

The system supports three user roles.

### Guest

A visitor who has not logged into the platform.

**Permissions**

- View Home Page
- Search Equipment
- View Equipment Details
- Register
- Login

---

### User

A registered user can act as both a farmer and an equipment owner.

**Farmer Permissions**

- Search Equipment
- Book Equipment
- Cancel Booking
- View Booking History
- Write Reviews
- Manage Profile

**Equipment Owner Permissions**

- Add Equipment
- Edit Equipment
- Delete Equipment
- Set Rental Price
- Set Availability
- Accept or Reject Booking Requests

---

### Admin (Future)

- Manage Users
- Manage Equipment
- Handle Reports
- Manage Categories

---

## Permission Matrix

| Feature | Guest | User | Admin |
|---------|:-----:|:----:|:-----:|
| View Home | ✅ | ✅ | ✅ |
| Search Equipment | ✅ | ✅ | ✅ |
| Register/Login | ✅ | ❌ | ❌ |
| Book Equipment | ❌ | ✅ | ✅ |
| Add Equipment | ❌ | ✅ | ✅ |
| Manage Own Equipment | ❌ | ✅ | ✅ |
| Write Reviews | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

---

## Authorization Rules

- Users can manage only their own equipment.
- Only equipment owners can approve or reject booking requests.
- Reviews can only be submitted after a completed booking.
- Guests cannot access protected features.