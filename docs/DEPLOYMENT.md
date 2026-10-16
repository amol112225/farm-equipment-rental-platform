# AgroRent — Production Deployment Guide

This guide details the deployment steps for the AgroRent platform across **Managed MySQL**, **Render** (Spring Boot Backend), and **Vercel** (React Frontend).

---

## Architecture Overview

```text
+-----------------------+         HTTPS REST API           +-------------------------------+
|    Vercel Frontend    |  ----------------------------->  |     Render Backend            |
| (React + Vite + HTML) |   CORS: https://*.vercel.app    | (Spring Boot 3.4.3 + Java 21) |
+-----------------------+                                  +-------------------------------+
                                                                          |
                                                                          | JDBC / TLS (SSL)
                                                                          v
                                                           +-------------------------------+
                                                           |     Managed MySQL             |
                                                           | (Aiven / PlanetScale / AWS)   |
                                                           +-------------------------------+
```

---

## Phase 1: Provision Managed MySQL Database

1. Choose a managed MySQL cloud provider (e.g., [Aiven for MySQL](https://aiven.io/), [Railway](https://railway.app/), [PlanetScale](https://planetscale.com/), or AWS RDS).
2. Create a new MySQL instance (Version 8.0 or later).
3. Create a database named `agrorent_db`.
4. Note the connection parameters:
   - **Host** (e.g., `mysql-12345.aivencloud.com`)
   - **Port** (e.g., `3306` or assigned port)
   - **Database Name** (e.g., `agrorent_db`)
   - **Username**
   - **Password**
   - **SSL Requirements** (most managed providers require `useSSL=true&requireSSL=true`)

5. Initialize the database schema using the version-controlled migration script:
   - Run the script located at [`docs/schema/V1__init_schema.sql`](schema/V1__init_schema.sql) in your MySQL management console (or MySQL Workbench / CLI).
   - This explicitly creates the `farmers`, `equipments`, and `bookings` tables with all primary keys, indexes, foreign keys, and character sets.

> [!IMPORTANT]
> **Controlled Production Schema Strategy**:
> Never use `ddl-auto=create` or `ddl-auto=create-drop` in production, as they drop tables and cause irrecoverable data loss.
> With `V1__init_schema.sql` executed, production strictly runs with `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`. Hibernate only validates the existing schema at startup without issuing any DDL modifications.

---

## Phase 2: Deploy Backend to Render

### Option A: Native Maven Build

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `agrorent-backend`
   - **Region**: Choose the region closest to your MySQL database.
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Java` (or Docker if preferred)
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/backend-0.0.1-SNAPSHOT.jar`
   - **Health Check Path**: `/api/health`

### Option B: Docker Runtime

If using Docker runtime on Render:
- **Root Directory**: `backend`
- **Runtime**: `Docker`
- Render will automatically use `backend/Dockerfile`.

### Render Environment Variables

Under **Environment Variables**, add the following:

| Variable Name | Example / Expected Value | Notes |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates `application-prod.properties` |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://<HOST>:<PORT>/agrorent_db?useSSL=true&requireSSL=true&serverTimezone=UTC` | Your managed MySQL JDBC connection string |
| `SPRING_DATASOURCE_USERNAME` | `<DB_USER>` | Your managed database username |
| `SPRING_DATASOURCE_PASSWORD` | `<STRONG_DB_PASSWORD>` | Your managed database password |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `validate` | Safe schema verification without drops |
| `SPRING_JPA_SHOW_SQL` | `false` | Keeps SQL statements out of logs |
| `JWT_SECRET` | `<32+_CHAR_RANDOM_SECRET>` | Generate using `openssl rand -base64 32` |
| `CORS_ALLOWED_ORIGINS` | `https://your-agrorent-app.vercel.app` | Exact URL of your deployed frontend on Vercel |

Click **Deploy Web Service**. Once deployed, test the health check endpoint:
```text
https://agrorent-backend.onrender.com/api/health
```

Expected response:
```json
{
  "application": "AgroRent Backend Foundation",
  "status": "UP",
  "database": {
    "connected": true,
    "details": "MySQL Database Connection Verified Successfully"
  }
}
```

---

## Phase 3: Deploy Frontend to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the Project Configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Expand the **Environment Variables** section and configure:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://agrorent-backend.onrender.com/api` | Points frontend to your Render backend API |

6. Click **Deploy**.
7. Once deployed, note your Vercel production domain (e.g., `https://agrorent-platform.vercel.app`).

---

## Phase 4: Finalize CORS Configuration

1. Return to your Render Web Service dashboard for `agrorent-backend`.
2. Under **Environment Variables**, verify that `CORS_ALLOWED_ORIGINS` matches your exact Vercel production domain:
   ```text
   CORS_ALLOWED_ORIGINS=https://agrorent-platform.vercel.app
   ```
   *(If you use preview deployments, you can supply multiple comma-separated URLs or wildcard patterns like `https://agrorent-platform.vercel.app,https://*-yourusername.vercel.app`)*.
3. Save changes so Render triggers a fast restart with the new CORS origin.

---

## Phase 5: Verification & End-to-End Testing

1. Open your Vercel frontend URL in a browser.
2. Open DevTools (F12) -> Network tab.
3. Test public equipment search on the Home page: requests must succeed with HTTP 200 from the Render backend.
4. Test farmer registration and login: check that JWT token is received and stored in `localStorage`.
5. Check that CORS preflight requests (`OPTIONS`) succeed with `Access-Control-Allow-Origin` matching your Vercel URL.
