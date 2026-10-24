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

5. Initialize the database schema using the version-controlled migration scripts:
   - For a fresh database, run [`docs/schema/V1__init_schema.sql`](schema/V1__init_schema.sql).
   - Apply subsequent migrations:
     - [`docs/schema/V2__create_reviews_table.sql`](schema/V2__create_reviews_table.sql) (Milestone 1 Owner Reviews)
     - [`docs/schema/V3__add_equipment_to_reviews.sql`](schema/V3__add_equipment_to_reviews.sql) (Milestone 1 Equipment Reviews)
     - [`docs/schema/V4__create_equipment_images_table.sql`](schema/V4__create_equipment_images_table.sql) (Milestone 2 Equipment Photos)
   - These scripts explicitly create tables, indexes, and constraints while safely preserving existing records.

> [!IMPORTANT]
> **Controlled Production Schema Strategy**:
> Never use `ddl-auto=create` or `ddl-auto=create-drop` in production, as they drop tables and cause irrecoverable data loss.
> With SQL migration scripts executed, production strictly runs with `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`. Hibernate verifies the schema at startup without issuing any destructive modifications.

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
| `CLOUDINARY_CLOUD_NAME` | `<your_cloud_name>` | Cloudinary account name for persistent CDN photo storage |
| `CLOUDINARY_API_KEY` | `<your_api_key>` | Cloudinary API Key (Backend only, never expose to frontend) |
| `CLOUDINARY_API_SECRET` | `<your_api_secret>` | Cloudinary API Secret (Backend only, strictly private) |

---

## Phase 2.5: Image Storage Configuration (Cloudinary & Local Fallback)

### Why Cloudinary Was Selected
Render web services run in stateless Docker containers with **ephemeral filesystems**. Any image files saved locally inside the container filesystem are permanently wiped whenever Render restarts, redeploys, or scales the instance.

**Cloudinary** was selected as the persistent cloud image storage provider because:
1. **Persistent Cloud Storage**: Files are permanently stored in the cloud and distributed across global CDNs.
2. **Compatibility with Vercel & Render**: Render backend uploads the image securely using backend-only credentials; Vercel frontend loads photos directly from Cloudinary HTTPS URLs.
3. **No Private Secrets on Frontend**: The frontend never has access to `CLOUDINARY_API_SECRET`. All uploads go through the Spring Boot backend (`/api/equipment` multipart endpoints).
4. **Zero-Configuration Local Development**: When `CLOUDINARY_CLOUD_NAME` is omitted or empty, the backend automatically falls back to `LocalStorageService`, storing photos in `backend/uploads/equipment/` and serving them at `/api/uploads/equipment/**`.

### Configuration Steps (Production on Render)
1. Sign up for a free account at [cloudinary.com](https://cloudinary.com/).
2. On your Cloudinary Dashboard, find:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. In your Render Dashboard under **Environment Variables**, set:
   - `CLOUDINARY_CLOUD_NAME`: your Cloud Name
   - `CLOUDINARY_API_KEY`: your API Key
   - `CLOUDINARY_API_SECRET`: your API Secret
4. **Upload Limits & Formats**:
   - Maximum file size: **5 MB per photo**.
   - Maximum photos per equipment: **5 photos**.
   - Supported formats: **JPEG/JPG**, **PNG**, **WebP**.
   - Security: Magic byte inspection and decodability validation are enforced on the backend. Files with spoofed extensions or corrupted headers are rejected with HTTP 400.

### Verifying Image Persistence After Deployment
1. Log into AgroRent on your deployed Vercel frontend.
2. Create or edit an equipment listing and upload photos.
3. Inspect the image URL: it should start with `https://res.cloudinary.com/<your_cloud_name>/image/upload/...`.
4. In the Render Dashboard, trigger a **Manual Deploy** -> **Deploy latest commit** or restart the service.
5. Once the backend finishes restarting, refresh the frontend page.
6. Verify that the equipment card and equipment booking detail modal continue to display the uploaded photos without broken links or missing images.

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
