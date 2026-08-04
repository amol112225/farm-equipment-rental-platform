# User Flows

This document describes the main workflows of the Farm Equipment Rental Platform.

---

# 1. User Registration

```text
Start
  │
  ▼
Open Registration Page
  │
  ▼
Enter User Details
  │
  ▼
Validate Input
  │
  ▼
Account Created
  │
  ▼
Login
```

---

# 2. User Login

```text
Start
  │
  ▼
Enter Email & Password
  │
  ▼
Credentials Valid?
      │
  ┌───┴────┐
  │        │
 Yes       No
  │        │
  ▼        ▼
Dashboard  Show Error
```

---

# 3. Equipment Listing

```text
Owner Dashboard
      │
      ▼
Add Equipment
      │
      ▼
Enter Equipment Details
      │
      ▼
Upload Images
      │
      ▼
Select Booking Type
      │
      ▼
Publish Equipment
```

---

# 4. Equipment Search

```text
Home Page
     │
     ▼
Search Equipment
     │
     ▼
Apply Filters
     │
     ▼
View Search Results
     │
     ▼
Open Equipment Details
```

---

# 5. Instant Booking Flow

```text
Equipment Details
        │
        ▼
Select Rental Dates
        │
        ▼
Book Now
        │
        ▼
Booking Confirmed
        │
        ▼
Booking Added to Dashboard
```

---

# 6. Request Booking Flow

```text
Equipment Details
        │
        ▼
Select Rental Dates
        │
        ▼
Send Booking Request
        │
        ▼
Owner Receives Request
        │
        ▼
Accept / Reject
      ┌────┴────┐
      │         │
   Accept     Reject
      │         │
      ▼         ▼
 Booking    Request
Confirmed   Rejected
```

---

# 7. Owner Booking Management

```text
Owner Dashboard
      │
      ▼
View Booking Requests
      │
      ▼
Open Request
      │
      ▼
Accept / Reject
      │
      ▼
Booking Status Updated
```

---

# 8. Review Flow

```text
Booking Completed
        │
        ▼
Rate Equipment
        │
        ▼
Write Review
        │
        ▼
Submit Review
```