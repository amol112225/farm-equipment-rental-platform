# AgroRent — External API Keys, Secrets, and Environment Configuration Guide

## 1. Overview & Repository Audit Summary

AgroRent is a full-stack farm equipment rental platform built with:
- **Frontend**: React 19 + Vite + Plain CSS
- **Backend**: Spring Boot 3.4.3 + Java 21 + Maven
- **Database**: MySQL 8.x
- **Target Hosting**: Vercel (Frontend), Render (Backend), Managed MySQL (Cloud Database)

### Key Audit Finding
**AgroRent currently uses ZERO third-party paid/external cloud APIs.**
There are no integrations with Google Maps, Google OAuth, Razorpay, Stripe, Cloudinary, AWS S3, Firebase, or external Email/SMS providers in the active source code.

The only credentials and secrets required by the current system are:
1. Managed MySQL database credentials.
2. An internal HMAC-SHA256 JWT signing secret.
3. CORS allowed origins configuration.
4. Frontend API base URL configuration.

---

## 2. Credentials & Secrets Inventory

| Credential / Variable | Used in Code? | Required Now? | Classification | Scope / Exposure | Source / Configuration Reader | Action Required |
|---|---|---|---|---|---|---|
| `SPRING_DATASOURCE_URL` | Yes | Currently required | Private Secret | Backend Only | `backend/src/main/resources/application.properties`, `application-prod.properties` | Set JDBC URL for local MySQL or Cloud Managed MySQL |
| `SPRING_DATASOURCE_USERNAME` | Yes | Currently required | Private Secret | Backend Only | `backend/src/main/resources/application.properties`, `application-prod.properties` | Set DB username (e.g., `root` locally, provisioned user in prod) |
| `SPRING_DATASOURCE_PASSWORD` | Yes | Currently required | Private Secret | Backend Only | `backend/src/main/resources/application.properties`, `application-prod.properties` | Set DB password via env; rotate previously committed local password |
| `JWT_SECRET` | Yes | Currently required | Private Secret | Backend Only | `backend/src/main/java/com/agrorent/backend/security/JwtTokenProvider.java` | Generate cryptographically secure 256-bit (>=32 chars) secret |
| `CORS_ALLOWED_ORIGINS` | Yes | Currently required | Public Config | Backend Only | `backend/src/main/java/com/agrorent/backend/config/SecurityConfig.java` | Configure allowed frontend URLs (e.g., `https://your-app.vercel.app`) |
| `VITE_API_BASE_URL` | Yes | Currently required | Public Config | Client Bundle | `frontend/src/services/api.js` | Point frontend to deployed Render backend URL |
| `SPRING_PROFILES_ACTIVE` | Yes | Currently required (Prod) | Environment Config | Backend Only | Spring Boot runtime | Set to `prod` in Render Web Service environment |
| `PORT` / `SERVER_PORT` | Yes | Currently required (Prod) | Server Config | Backend Only | `backend/src/main/resources/application-prod.properties`, `Dockerfile` | Injected dynamically by Render |
| Google Maps API Key | No | Not required | N/A | None | N/A | No code implements Google Maps |
| Google OAuth / Client ID | No | Not required | N/A | None | N/A | No code implements OAuth |
| Payment Gateway (Razorpay/Stripe) | No | Future feature | N/A | None | N/A | Feature planned for future milestone |
| Cloud Image Storage (Cloudinary/S3) | No | Future feature | N/A | None | N/A | Listings currently accept standard image URLs |
| Email Service (SMTP/SendGrid) | No | Future feature | N/A | None | N/A | Feature planned for future milestone |

---

## 3. Credential Specifications & Requirements

### A. Database Credentials (`SPRING_DATASOURCE_*`)
- **Feature**: Entity persistence (Farmers, Equipments, Bookings) via Spring Data JPA and Hibernate.
- **Environment Variables**:
  - `SPRING_DATASOURCE_URL`: Full JDBC connection string with TLS/SSL flags.
  - `SPRING_DATASOURCE_USERNAME`: Database user.
  - `SPRING_DATASOURCE_PASSWORD`: Database user password.
- **Local vs Production**:
  - *Local*: `jdbc:mysql://localhost:3306/agrorent_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`, user `root`, local password.
  - *Production*: `jdbc:mysql://<HOST>:<PORT>/agrorent_db?useSSL=true&requireSSL=true&serverTimezone=UTC`, managed user and password.
- **Security Scope**: Strictly Private. Must never be exposed to the client or committed to source control.

### B. JWT Secret Key (`JWT_SECRET`)
- **Feature**: Stateless user authentication. Signs and validates HMAC-SHA256 JSON Web Tokens in `JwtTokenProvider.java`.
- **Environment Variable**: `JWT_SECRET`
- **Validation Rules**:
  - Must be at least 256 bits (32 characters / bytes) in length.
  - If shorter than 32 bytes or empty, backend startup is aborted with an `IllegalStateException`.
- **Local vs Production**:
  - *Local*: Can use local developer secret or the non-production fallback defined in `application.properties`.
  - *Production*: Must be a cryptographically random, unique secret generated specifically for production.
- **Security Scope**: Strictly Private. Anyone possessing this key can forge authentication tokens for any user.

### C. CORS Allowed Origins (`CORS_ALLOWED_ORIGINS`)
- **Feature**: Spring Security Cross-Origin Resource Sharing filter in `SecurityConfig.java`.
- **Environment Variable**: `CORS_ALLOWED_ORIGINS`
- **Local vs Production**:
  - *Local default*: `http://localhost:5173,http://localhost:5174,http://localhost:3000`
  - *Production*: Exact Vercel domain (e.g., `https://agrorent-platform.vercel.app`). Comma-separated if multiple domains or preview deployments are used.
- **Security Scope**: Public server configuration.

### D. Frontend API Base URL (`VITE_API_BASE_URL`)
- **Feature**: Centralized REST API client in `frontend/src/services/api.js`.
- **Environment Variable**: `VITE_API_BASE_URL`
- **Local vs Production**:
  - *Local default*: `http://localhost:8080/api`
  - *Production*: `https://agrorent-backend.onrender.com/api` (must include `/api` suffix, trailing slashes are automatically sanitized by `api.js`).
- **Security Scope**: **Deliberately Public**. All variables starting with `VITE_` are embedded into the client-side JavaScript bundle during build time and can be inspected by any browser user. **Never put private keys or secrets in `VITE_` variables.**

---

## 4. Local Configuration (Windows PowerShell)

Standard Spring Boot does not read `.env` files automatically at startup. Use one of the supported methods below:

### Method 1: Set Variables in PowerShell Session (Recommended)

```powershell
# 1. Set Backend Environment Variables
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/agrorent_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="YOUR_LOCAL_DB_PASSWORD"
$env:JWT_SECRET="AgroRent_Super_Secure_Local_Dev_JWT_Secret_32_Bytes!"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:3000"

# 2. Start Backend
cd "backend"
mvn spring-boot:run
```

### Method 2: Load from Local `backend/.env` via PowerShell Helper

If you maintain a local `backend/.env` file (which is git-ignored):

```powershell
cd "backend"
Get-Content .env | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
    $k,$v = $_.Split('=',2)
    [System.Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), 'Process')
}
mvn spring-boot:run
```

### Method 3: Frontend Local Configuration

```powershell
cd "frontend"
# Copy template to .env.local (which is git-ignored)
Copy-Item .env.example .env.local

# Run frontend dev server
npm run dev
```

---

## 5. Production Configuration (Render & Vercel)

### Backend Deployment on Render

1. Create a **Web Service** on Render connected to the repository `main` branch.
2. Root directory: `backend`
3. In the Render Dashboard, navigate to **Environment Variables** and add:

| Key | Example Value | Description |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates `application-prod.properties` |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://<HOST>:<PORT>/agrorent_db?useSSL=true&requireSSL=true&serverTimezone=UTC` | Managed Cloud MySQL connection string |
| `SPRING_DATASOURCE_USERNAME` | `agrorent_user` | Managed MySQL username |
| `SPRING_DATASOURCE_PASSWORD` | `[STRONG_GENERATED_PASSWORD]` | Managed MySQL password |
| `JWT_SECRET` | `[RANDOM_BASE64_32_BYTE_SECRET]` | Cryptographic JWT signing key |
| `CORS_ALLOWED_ORIGINS` | `https://your-agrorent-app.vercel.app` | Exact production Vercel frontend domain |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `validate` | Prevents destructive schema drops in prod |
| `SPRING_JPA_SHOW_SQL` | `false` | Prevents SQL queries from leaking in logs |

> **Generating a secure production JWT secret in PowerShell:**
> ```powershell
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
> ```

### Frontend Deployment on Vercel

1. Import project to Vercel.
2. Root directory: `frontend`
3. Framework Preset: `Vite`
4. Under **Settings -> Environment Variables**, configure:

| Key | Example Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://agrorent-backend.onrender.com/api` | Render backend URL with `/api` path |

---

## 6. Secret Security, Git Protection, and Rotation Advisory

### A. Previously Tracked Secret Incident & Rotation Requirement
- **Finding**: In commit `7d0df70` and `6f49938`, a local MySQL database password (`spring.datasource.password`) was committed in plaintext in:
  - `backend/src/main/resources/application.properties`
  - `backend/target/classes/application.properties`
- **Mitigation Completed**: `backend/src/main/resources/application.properties` has been updated to use dynamic environment variable substitution `${SPRING_DATASOURCE_PASSWORD:}` with no hardcoded plaintext passwords.
- **Rotation Action Required**:
  - If that password was used on any shared, staging, or production database, **it must be rotated immediately**.
  - Always provision a completely distinct, strong password for managed production databases.

### B. Git Tracking & Ignore Status
- Root `.gitignore` and `backend/.gitignore` properly ignore `.env`, `.env.local`, `.env.*`.
- `frontend/.gitignore` has been updated to explicitly ignore `.env`, `.env.local`, `.env.*`.
- `.env.example` templates remain trackable across root, frontend, and backend.
- **Advisory on Tracked Target Artifacts**: Previously, `backend/target/` was committed to the repository. While `.gitignore` now ignores `target/`, Git continues tracking previously indexed files until untracked with approval (`git rm -r --cached backend/target`).

---

## 7. Future Integrations & Anticipated Requirements

When future milestones are implemented, the following credentials will be required:

| Milestone / Feature | Service | Keys Required | Where Needed | Expected Secret Type |
|---|---|---|---|---|
| Online Payments | Razorpay / Stripe | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Backend (secret), Frontend (public key ID) | Private secret + Public key |
| Interactive Location & Maps | Google Maps Platform | `VITE_GOOGLE_MAPS_API_KEY` | Frontend | Restricted Public API Key (HTTP referrer restriction) |
| Cloud Image & Document Uploads | Cloudinary / AWS S3 | `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` or `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Backend | Private Server Secrets |
| SMS & Email Notifications | Twilio / SendGrid / SMTP | `SENDGRID_API_KEY` or `SPRING_MAIL_PASSWORD` | Backend | Private Server Secrets |
