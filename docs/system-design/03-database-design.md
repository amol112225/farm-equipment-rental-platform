# Database Design

## Overview

The Farm Equipment Rental Platform uses **MySQL** as the primary database because it provides strong support for relational data, transactions, and data integrity. The database is designed to support both the current web application and future Android application.

---

## Main Entities

- User
- Category
- Equipment
- EquipmentImage
- Booking
- Review
- Notification

---

## Entity Relationships

- One User can own multiple Equipment.
- One Category can have multiple Equipment.
- One Equipment can have multiple Images.
- One User can create multiple Bookings.
- One Equipment can have multiple Bookings.
- One Booking can have one Review.
- One User can receive multiple Notifications.

---

## Tables

| Table | Purpose |
|---------|---------|
| User | Stores user information |
| Category | Stores equipment categories |
| Equipment | Stores equipment details |
| EquipmentImage | Stores equipment images |
| Booking | Stores booking details |
| Review | Stores ratings and reviews |
| Notification | Stores user notifications |

---

## Primary Keys

- User → BIGINT
- Category → INT
- Equipment → BIGINT
- EquipmentImage → BIGINT
- Booking → BIGINT
- Review → BIGINT
- Notification → BIGINT

All IDs use **AUTO_INCREMENT**.

---

## Common Fields

Every table contains:

- id
- createdAt
- updatedAt

This helps track record creation and modifications.

---

## Equipment Status

Equipment status represents the condition of the equipment.

Possible values:

- ACTIVE
- INACTIVE
- UNDER_MAINTENANCE

Actual booking availability is determined from booking dates instead of this status.

---

## Booking Type

Two booking modes are supported:

- INSTANT
- REQUEST

---

## Booking Status

A booking can have one of the following states:

- PENDING
- ACCEPTED
- REJECTED
- CANCELLED
- COMPLETED

---

## Equipment Images

Each equipment can have multiple images.

Images are stored in a separate table to support unlimited image uploads and simplify future integration with cloud storage services.

---

## Reviews

Users can submit a review only after a booking is completed.

This ensures that ratings and reviews are genuine.

---

## Notifications

Notifications are categorized using predefined types.

Examples:

- BOOKING_REQUEST
- BOOKING_ACCEPTED
- BOOKING_REJECTED
- BOOKING_CANCELLED

---

## Soft Delete

Equipment records are not permanently deleted.

Instead, an `isDeleted` flag is used to preserve booking history and improve data recovery.

---

## Database Choice

MySQL was selected because the project contains multiple related entities such as Users, Equipment, Categories, and Bookings. A relational database ensures consistency, supports transactions, and efficiently manages relationships using foreign keys.