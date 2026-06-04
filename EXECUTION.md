# Execution, Environment, and Implementation Guide

This guide provides a comprehensive, step-by-step walkthrough to set up, configure, and execute the upgraded **Nexus Rooms Platform** in your local environment.

By design, all features—including folders explorer, tag systems, threaded comments, multi-version rollbacks, and Server-Sent Events (SSE) sync—are configured to run locally using **100% free and local mocks**. You do not need any paid SaaS accounts.

---

## 🛠️ Step 1: Core Setup & Services

Before launching the applications, you must boot the local database and cache services using Docker.

### 🐳 Docker Services Setup
1. **Prerequisite**: Ensure that [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running on your system.
2. **Path to Execute**: Workspace Root (`C:\Users\AZHAN\OneDrive\Desktop\nexus\nexus_rooms`)
3. **Exact Command to Run**:
   ```bash
   docker-compose up -d
   ```
   *This command runs in the background (`-d`) and boots:*
   - **PostgreSQL Database** on `localhost:5432` (User: `nexus_user`, Password: `nexus_password`, Database: `nexus_rooms_db`).
   - **Redis Cache/PubSub** on `localhost:6379`.

### 🗃️ Prisma Database Synchronization
Synchronize your local PostgreSQL database schema to match the Prisma models (this creates the Folder, Tag, ContentVersion, Comment, and Activity tables instantly).
1. **Path to Execute**: Workspace Root (`C:\Users\AZHAN\OneDrive\Desktop\nexus\nexus_rooms`)
2. **Exact Command to Run**:
   ```bash
   npx prisma@5.5.2 db push --schema=apps/backend/prisma/schema.prisma
   ```
   *(We use `db push` instead of `migrate dev` for local environments to directly sync schemas with the container without shadow-database conflicts).*

---

## 📦 Step 2: Monorepo Compilation

Before launching development servers, perform a full build audit to bundle the shared TypeScript type contracts and API client packages.

1. **Path to Execute**: Workspace Root (`C:\Users\AZHAN\OneDrive\Desktop\nexus\nexus_rooms`)
2. **Exact Command to Run**:
   ```bash
   npm run build
   ```
   *This commands runs Turborepo to build: `@nexus/types` -> `@nexus/api-client` -> `@nexus/backend` -> `@nexus/frontend`.*

---

## 🚀 Step 3: Booting Dev Servers

Once compiled, boot both server workspaces concurrently:

1. **Path to Execute**: Workspace Root (`C:\Users\AZHAN\OneDrive\Desktop\nexus\nexus_rooms`)
2. **Exact Command to Run**:
   ```bash
   npm run dev
   ```
   *This command starts:*
   - **Fastify Backend** on [http://localhost:3001](http://localhost:3001)
   - **Vite React Frontend** on [http://localhost:5173](http://localhost:5173)

---

## ✉️ Step 4: Local Dev Console Email Verification Simulator

To satisfy the **email-based registration verification** requirement without paid SMTP or SES services:
1. When a user registers a new account on `http://localhost:5173/login`, the backend generates a secure verification token and saves it in PostgreSQL.
2. In the terminal where you ran the backend server (`npm run dev`), the server automatically prints a **visible simulation box** with a clickable dev link:
   ```text
   ========================================================================
   ✉️  [LOCAL DEV] EMAIL VERIFICATION INBOX SIMULATION FOR: user@example.com
   👉 Verification Link: http://localhost:5173/verify-email?token=8f3b2a...
   ========================================================================
   ```
3. **Action**: Copy the `http://localhost:5173/verify-email?token=...` link and paste it into your browser.
4. The page will verify the token, flag `emailVerified: true` in the database, and redirect you to login.
5. The **Password Reset** flow works the exact same way: request a password reset, copy the link printed in your terminal, and navigate to it to input a new password.

---

## 🔑 Environment Variables From-Scratch Setup Guide

This section explains exactly **what every variable does**, **where to get its value from scratch**, and **how to configure it**.

---

### 📂 Backend Environment (`apps/backend/.env`)

Create `apps/backend/.env` in your editor and configure the following variables:

#### 1. Server Configuration
- **`HOST=0.0.0.0`**
  - *What it is*: The server bind address.
  - *Where to get*: Default value. Using `0.0.0.0` binds to all local network interfaces (allowing local devices to access the API).
- **`PORT=3001`**
  - *What it is*: The network port.
  - *Where to get*: Default value. Ensure port `3001` is free on your localhost.
- **`LOG_LEVEL=info`**
  - *What it is*: Pino log detail level.
  - *Where to get*: Default values: `debug`, `info`, `warn`, or `error`.
- **`NODE_ENV=development`**
  - *What it is*: Run mode context.
  - *Where to get*: Set to `development` locally and `production` in staging.

#### 2. Database Connection
- **`DATABASE_URL=postgresql://nexus_user:nexus_password@localhost:5432/nexus_rooms_db?schema=public`**
  - *What it is*: Prisma Connection String.
  - *Where to get*: Since we use standard local Docker containers, this is pre-configured to match the credentials inside `docker-compose.yml` (Port `5432`, DB name `nexus_rooms_db`).
  - *SaaS Alternative (Free)*: If you want a cloud database instead of Docker, sign up for a free PostgreSQL database on [Supabase](https://supabase.com) or [Neon](https://neon.tech), create a project, copy the connection URL, and paste it here.

#### 3. Cryptography & RS2048 JWT Keys
We utilize **RSA asymmetric keys** to sign cookies and authenticate tokens.
- **`JWT_PRIVATE_KEY`** & **`JWT_PUBLIC_KEY`**
  - *What it is*: RSA private/public keys in PEM format (newlines replaced by `\n`).
  - *How to Generate from Scratch (Free)*:
    1. Open your terminal (or Git Bash / PowerShell) and generate a private key:
       ```bash
       openssl genrsa -out private.pem 2048
       ```
    2. Extract the public key from the generated private key:
       ```bash
       openssl rsa -in private.pem -pubout -out public.pem
       ```
    3. Format these keys to fit on a single line by escaping newlines. Replace all literal newlines with `\n` so that the string fits perfectly inside your `.env` file like this:
       `JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...-----END PRIVATE KEY-----\n"`
       `JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBg...-----END PUBLIC KEY-----\n"`
- **`REFRESH_TOKEN_SECRET`**
  - *What it is*: 256-bit cryptographically secure key to sign refresh tokens.
  - *How to Generate from Scratch (Free)*:
    Run the following command in your terminal to generate a secure random hex key:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
    Copy the generated hex string (e.g. `5aebdded...`) and paste it.

#### 4. AWS S3 Simulation (Virtual Local S3)
- **`AWS_REGION=us-east-1`** (Optional for local)
- **`AWS_ACCESS_KEY_ID=mock-local-access-key-id`** (Optional for local)
- **`AWS_SECRET_ACCESS_KEY=mock-local-secret-access-key`** (Optional for local)
- **`S3_BUCKET_NAME=nexus-uploads-dev`** (Optional for local)
- **`S3_UPLOADS_PREFIX=rooms/`**
  - *What it is*: Subfolder prefix.
  - *Why it is free/local*: Our platform implements a **Local Disk S3 simulator**! When you upload a file, the server streams the file directly to your local computer under `apps/backend/uploads/` and serves it statically under `/uploads/`.
  - *How to get AWS S3 (Staging)*: If you want to connect to a real S3 bucket, sign up for a free tier AWS account at [AWS Portal](https://aws.amazon.com), create an IAM user, fetch the Access Key ID and Secret Access Key, create an S3 bucket, enable public read access, and paste those real credentials here.

#### 5. Email Service (AWS SES / Dev Simulator)
- **`AWS_SES_REGION=us-east-1`** (Optional)
- **`SENDER_EMAIL=noreply@nexus.app`** (Optional)
  - *What it is*: Address that verification mails are dispatched from.
  - *Why it is free/local*: We have implemented a console email simulator. The server intercepts outgoing verification and password reset emails and prints the fully formatted clickable token links straight into the backend terminal console.
  - *How to get AWS SES (Staging)*: In production, verify a sending domain inside the AWS console at [Amazon SES Console](https://console.aws.amazon.com/ses), request production access, input your regional SES region, verified sender email, and ensure your backend server environment has standard AWS permissions.

#### 6. Monitoring & Core Constants
- **`BCRYPT_COST=12`**
  - *What it is*: Salt rounds used by the password hashing library.
  - *Where to get*: Constant integer. 12 is the secure industry standard.
- **`SESSION_MAX_AGE=2592000000`**
  - *What it is*: Token expiration in milliseconds (default `2592000000` = 30 days).
- **`SENTRY_DSN=`**
  - *What it is*: Error tracking integration key.
  - *Where to get (Free)*: Optional. If you want free application error monitoring, sign up for a free developer account at [Sentry.io](https://sentry.io), create a project, fetch the DSN URL, and input it here.

---

### 📂 Frontend Environment (`apps/frontend/.env`)

Create `apps/frontend/.env` in your editor and configure the following variables:

- **`VITE_API_URL=http://localhost:3001`**
  - *What it is*: The endpoint URL of the Fastify API.
  - *Where to get*: Use `http://localhost:3001` to match your local backend port.
- **`VITE_APP_URL=http://localhost:5173`**
  - *What it is*: The browser location of the React app.
  - *Where to get*: Use `http://localhost:5173` to match the local Vite development server.

---

## 🗄️ Step 5: Visual DB Administration (Prisma Studio)

If you ever want to view your user profiles, folders, tags, comments, or activity logs visually in your browser:

1. **Path to Execute**: Workspace Root (`C:\Users\AZHAN\OneDrive\Desktop\nexus\nexus_rooms`)
2. **Exact Command to Run**:
   ```bash
   npx prisma@5.5.2 studio --schema=apps/backend/prisma/schema.prisma
   ```
3. Open [http://localhost:5555](http://localhost:5555) in your web browser. You will see a complete graphical dashboard allowing you to inspect, modify, and delete rows in your PostgreSQL database directly!
