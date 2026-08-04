# System Architecture

## Overview

The Farm Equipment Rental Platform follows a **3-Tier Architecture**, separating the application into three independent layers. This makes the system modular, maintainable, and easy to scale.

---

## Architecture Diagram

```text
+----------------------+
|      Frontend        |
| React + Tailwind CSS |
+----------+-----------+
           |
      REST API (HTTP)
           |
+----------v-----------+
|       Backend        |
|  Node.js + Express   |
+----------+-----------+
           |
     SQL Queries
           |
+----------v-----------+
|      Database        |
|        MySQL         |
+----------------------+
```

---

## Frontend

The frontend is built using **React** and **Tailwind CSS**.

Responsibilities:
- Display user interface
- Handle user interactions
- Validate form inputs
- Call backend APIs
- Display data received from the server

---

## Backend

The backend is developed using **Node.js** and **Express.js**.

Responsibilities:
- Process API requests
- Authenticate users
- Implement business logic
- Validate data
- Communicate with the database

---

## Database

The application uses **MySQL** as the relational database.

Responsibilities:
- Store user information
- Store equipment details
- Store bookings
- Store reviews
- Maintain relationships between entities

---

## Communication Flow

```text
User
  │
  ▼
React Frontend
  │
  ▼
REST API
  │
  ▼
Express Backend
  │
  ▼
MySQL Database
```

---

## Future Architecture

The backend APIs will also be used by the Android application without changing the backend.

```text
          React Web
               │
               │
Android App ───┤
               ▼
        Express Backend
               │
            MySQL
```

---

## Advantages

- Clear separation of responsibilities
- Easy to maintain
- Scalable architecture
- Reusable backend APIs
- Supports future Android application