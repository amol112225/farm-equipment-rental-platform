# AgroRent — Local Environment Setup Guide

This guide walks you through setting up, configuring, and verifying the AgroRent platform on Windows using PowerShell.

---

## 1. System Prerequisites

Ensure the following tools are installed and accessible in your Windows system `PATH`:

- **Java JDK 21**: Verify with `java -version` (JDK 21 or later is required).
- **Apache Maven 3.9+**: Verify with `mvn -version`.
- **Node.js (v18+ or v20+) & npm**: Verify with `node -version` and `npm -version`.
- **MySQL Server 8.x**: Local instance running on port `3306`.

---

## 2. Database Setup (Local MySQL)

1. Open your MySQL client (e.g., MySQL Command Line Client or MySQL Workbench).
2. Create the local development database:

```sql
CREATE DATABASE IF NOT EXISTS agrorent_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Ensure your local MySQL user has read and write privileges for `agrorent_db`.

---

## 3. Backend Setup (Spring Boot + Java 21)

### A. Environment Configuration in PowerShell

The backend supports zero-config local defaults (fallback to `localhost:3306`, user `root`, empty password, and a default local JWT secret).

If your local MySQL requires a password or custom user, set the environment variables in your PowerShell session:

```powershell
# Navigate to the backend directory
cd "backend"

# (Optional) Set your local MySQL password and database credentials
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/agrorent_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="your_local_mysql_password"

# (Optional) Set a local JWT secret (minimum 32 characters / 256 bits)
$env:JWT_SECRET="AgroRent_Super_Secure_Local_Dev_JWT_Secret_32_Bytes!"

# (Optional) Allowed CORS Origins for local development
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:3000"
```

### B. Run Backend Tests

Verify that the backend compiles and all unit tests pass:

```powershell
mvn clean test
```

### C. Start the Backend Server

```powershell
mvn spring-boot:run
```

The Spring Boot backend will start on `http://localhost:8080`.
Verify health by opening: `http://localhost:8080/api/health`

---

## 4. Frontend Setup (React + Vite)

### A. Configure Local Environment File

1. Navigate to the `frontend/` directory:

```powershell
cd "..\frontend"
```

2. Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

3. The default value in `.env.local` points to `http://localhost:8080/api`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

### B. Install Dependencies & Run Development Server

```powershell
npm install
npm run dev
```

The React frontend will be available at `http://localhost:5173`.

### C. Verify Frontend Production Build

```powershell
npm run build
```

This generates production assets in `frontend/dist/`.
