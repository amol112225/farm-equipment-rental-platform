# AgroRent — Production Security Checklist

This checklist defines mandatory security controls and verification procedures before deploying AgroRent to production.

---

## 1. Credentials & Secret Management

- [ ] **Rotate Exposed Credentials**:
  - The local database password previously present in `application.properties` and Git history must be changed immediately on any database where it was used.
  - Never reuse local development passwords for production databases.
- [ ] **No Hardcoded Secrets**:
  - `application.properties` contains zero production credentials or plaintext passwords.
  - `application-prod.properties` contains zero hardcoded secrets; all sensitive properties strictly read from environment variables.
- [ ] **Git Tracking Check**:
  - Ensure `.env` and `.env.*` files are excluded by `.gitignore` in repository root, backend, and frontend.
  - Only `.env.example` templates with non-sensitive placeholders are committed.
  - Build targets (`target/`, `node_modules/`, `dist/`) must never be added to Git.
- [ ] **JWT Signing Secret**:
  - Production `JWT_SECRET` must be cryptographically generated and at least 32 characters (256 bits) long.
  - In PowerShell:
    ```powershell
    [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
    ```
  - In Linux / Bash:
    ```bash
    openssl rand -base64 32
    ```

---

## 2. Frontend Security (Vercel)

- [ ] **Public Variable Scope**:
  - Only `VITE_API_BASE_URL` is exposed to the frontend.
  - No database credentials, server API keys, or JWT secrets are defined with `VITE_` prefix.
- [ ] **Client Token Handling**:
  - Bearer tokens are sent via the standard `Authorization: Bearer <token>` HTTP header.
  - Expired tokens or 401 Unauthorized responses trigger automatic session termination in `AuthContext.jsx`.
- [ ] **HTTP Security Headers**:
  - `frontend/vercel.json` provides defense-in-depth headers:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `X-XSS-Protection: 1; mode=block`
    - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 3. Backend & API Security (Render)

- [ ] **CORS Strict Origin Validation**:
  - Production backend rejects requests from unauthorized domains.
  - `CORS_ALLOWED_ORIGINS` is configured with the exact production Vercel domain (e.g. `https://your-agrorent-app.vercel.app`).
  - Wildcard `*` is not permitted when `allowCredentials` is true.
- [ ] **Error Response Sanitization**:
  - `GlobalExceptionHandler` masks unhandled server exceptions as generic error messages (`HTTP 500`).
  - Stack traces, database class names, and raw SQL queries are hidden from end users.
  - Health check endpoint `/api/health` suppresses raw database exception messages.
- [ ] **Log Hygiene**:
  - `spring.jpa.show-sql` is disabled (`false`) in production.
  - Hibernate descriptor logging is set to `ERROR` to prevent printing query parameters in Render logs.

---

## 4. Database & JPA Protection (Managed MySQL)

- [ ] **Baseline Schema Applied**:
  - The schema from `docs/schema/V1__init_schema.sql` has been executed on the production MySQL instance prior to backend launch.
- [ ] **Schema Immutability**:
  - `spring.jpa.hibernate.ddl-auto` is set to `validate` in `application-prod.properties`.
  - Hibernate will never execute `DROP TABLE` or destructive `ALTER TABLE` commands against production data.
- [ ] **Encrypted Connection**:
  - Managed MySQL connection string must enforce SSL (`useSSL=true&requireSSL=true`).
- [ ] **Least Privilege Access**:
  - Database user credentials provisioned for the backend application should only have permissions on the `agrorent_db` schema.

---

## 5. Pre-Deployment Sign-Off Table

| Security Control | Verification Method | Status |
| :--- | :--- | :--- |
| Secrets Externalized | Grep for hardcoded passwords in `src/` | Verified |
| Environment Templates | `backend/.env.example` and `frontend/.env.example` verified | Verified |
| Build Isolation | `.gitignore` covers `target/`, `node_modules/`, `dist/`, `.env*` | Verified |
| Dynamic Port Binding | Backend supports `${PORT:${SERVER_PORT:8080}}` | Verified |
| Production Profile | `application-prod.properties` configured without fallbacks | Verified |
| CORS Configuration | Tested via `SecurityConfig.java` environment binding | Verified |
| Backend Maven Tests | 38/38 Unit Tests Passing via `mvn clean test` | Verified |
| Frontend Vite Build | `npm run build` succeeds cleanly | Verified |
| Password Rotation | Mandatory manual rotation in MySQL user account | Pending User Action |
