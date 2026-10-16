# AgroRent — Farm Equipment Rental Platform

AgroRent is a modern, peer-to-peer farm equipment rental platform designed to empower farmers by enabling equipment sharing, seamless booking, and transparent availability management.

---

## Architecture & Technology Stack

- **Frontend**: React 19, JavaScript, Plain CSS, Vite build system.
- **Backend**: Spring Boot 3.4.3, Java 21, Spring Security, JJWT (HMAC-SHA256), Spring Data JPA, Maven.
- **Database**: MySQL 8.x (support for managed providers: Aiven, PlanetScale, Railway, AWS RDS).
- **Deployment Targets**:
  - Frontend: [Vercel](https://vercel.com/)
  - Backend: [Render](https://render.com/) (Web Service or Docker)
  - Database: Managed MySQL

---

## Project Structure

```text
farm-equipment-rental-platform/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/agrorent/backend/    # Spring Boot controllers, services, repositories
│   │   │   └── resources/
│   │   │       ├── application.properties     # Base & local dev configuration with safe defaults
│   │   │       └── application-prod.properties# Production profile (zero hardcoded secrets)
│   │   └── test/                             # Mockito unit tests (38 tests)
│   ├── .env.example                          # Backend environment variable template
│   ├── .gitignore                            # Excludes target/, binaries, and local .env files
│   ├── Dockerfile                            # Multi-stage Java 21 JRE container build
│   └── pom.xml                               # Maven project dependencies and build plugins
├── frontend/
│   ├── src/
│   │   ├── components/                       # Shared UI components
│   │   ├── context/                          # React authentication context
│   │   ├── features/                         # Feature modules (auth, booking, equipment)
│   │   ├── pages/                            # Home, OwnerDashboard, RenterDashboard
│   │   └── services/                         # Centralized API client & HTTP services
│   ├── public/                               # Static assets and favicons
│   ├── .env.example                          # Frontend environment variable template
│   ├── .gitignore                            # Excludes dist/, node_modules/, and local .env files
│   ├── package.json                          # Frontend dependencies and Vite build scripts
│   ├── vercel.json                           # Vercel SPA routing rewrite rules & security headers
│   └── vite.config.js                        # Vite bundler configuration
├── docs/
│   ├── ENVIRONMENT_SETUP.md                  # Comprehensive local development setup guide
│   ├── DEPLOYMENT.md                         # Production deployment steps for Render, Vercel & MySQL
│   ├── SECURITY_CHECKLIST.md                 # Pre-deployment security controls & verification
│   ├── adr/                                  # Architectural Decision Records
│   ├── planning/                             # Feature breakdowns & user flows
│   └── system-design/                        # System design specifications
├── .gitignore                                # Root exclusion rules for Git
└── README.md                                 # Project documentation
```

---

## Quick Start (Local Development)

### 1. Backend (Spring Boot)

Prerequisites: JDK 21, Maven 3.9+, MySQL running locally.

```powershell
# Open backend directory
cd backend

# Run automated tests
mvn clean test

# Run Spring Boot application
mvn spring-boot:run
```

Backend starts on: `http://localhost:8080`  
Health check endpoint: `http://localhost:8080/api/health`

### 2. Frontend (React + Vite)

Prerequisites: Node.js 18+ or 20+.

```powershell
# Open frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend starts on: `http://localhost:5173`

---

## Deployment & Production Readiness

- For local environment variables in PowerShell: see [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md).
- For step-by-step production hosting on Render, Vercel, and Managed MySQL: see [DEPLOYMENT.md](docs/DEPLOYMENT.md).
- For pre-deployment security review and secret rotation instructions: see [SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md).
