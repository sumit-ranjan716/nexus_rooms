# NEXUS ROOMS — MINIMUM VIABLE PRODUCT (MVP) SPECIFICATION

**Version:** 1.0-MVP  
**Date:** May 2026  
**Scope:** Buildable first release with core value, clean architecture, and upgrade path to full blueprint

---

## EXECUTIVE SUMMARY

Nexus Rooms MVP is a **private room-based file sharing application** focused on delivering one core use case: small teams or individuals can quickly create a password-protected room, invite others via a link, and upload/download files in a shared space. No real-time collaboration, no versioning, no advanced features — just **working file sharing with RBAC and clean code**.

**Time-to-market:** 8–10 weeks with 2–3 full-stack engineers  
**Success definition:** Users can sign up, create a room, invite others, upload/download 5 file types, and complete the flow in < 2 minutes.

---

## 1. MVP SCOPE

### 1.1 What Is Included

#### Authentication & Users
- [x] Email/password signup and login
- [x] Session management with JWT (access token + refresh token in HttpOnly cookie)
- [x] Password reset (email-based, time-limited token)
- [x] Email verification (send verification link on signup)
- [x] User profile (display name, email, avatar URL nullable)
- [ ] OAuth (Google, GitHub) — **DEFER to v1.0**

#### Rooms
- [x] Create rooms with name, optional description
- [x] Auto-generate 8-character unique room ID (alphanumeric)
- [x] Optional password protection (bcrypt hashed)
- [x] Join room via room ID (if not password-protected) or invite link
- [x] Room metadata: name, description, member count, creator, created date
- [x] Delete room (admin only, cascade delete)
- [x] Room listing dashboard

#### Invite Links
- [x] Generate invite links (format: /join/{roomId}?token={HMAC-signed})
- [x] Configurable expiry (24h, 7d, 30d, never)
- [x] Role assignment on invite (admin or viewer)
- [x] Revoke all active invites for a room (admin)
- [x] Single-use option (optional)
- [x] Guest access — no mandatory account creation for invite link following
  - Guest accepts invite → optionally creates account later

#### File Sharing (Core MVP Value)
- [x] Upload documents: **PDF only** (max 50 MB per file)
- [x] Upload images: **JPG, PNG only** (max 50 MB per file)
- [x] Files stored in AWS S3 (private bucket)
- [x] Download files via presigned URLs (15-min expiry)
- [x] File list: Grid or list view (toggle, user preference)
- [x] File preview (inline PDF viewer, image viewer)
- [x] Delete files (admin only)
- [x] File metadata: filename, type, size, uploader, upload date
- [ ] File versioning — **DEFER to v1.0**
- [ ] Comments on files — **DEFER to v1.0**
- [ ] Tagging — **DEFER to v1.0**
- [ ] Search — **DEFER to v1.0**

#### RBAC (Simplified)
- [x] Two roles: **Admin** and **Viewer**
- Admin in a room:
  - Upload files
  - Delete files
  - Manage members (remove members, change roles)
  - Generate invite links
  - Delete room
- Viewer in a room:
  - View files
  - Download files
  - View member list
- Enforcement: API middleware + PostgreSQL row-level security (RLS)

#### UI/UX (Functional, Not Polished)
- [x] Login/signup screens (functional, minimal design)
- [x] Dashboard (user's rooms + join/create room actions)
- [x] Room view (file grid/list + upload button)
- [x] Upload modal (drag-drop or file picker, progress bar)
- [x] File preview modal (PDF/image viewer)
- [x] Room settings (name, description, invite management)
- [x] Member management (list, remove, change role)
- [x] Responsive: works on mobile (375px) and desktop (1440px)
- [x] No advanced polish, but clean and usable
- [ ] Real-time updates — **DEFER to v1.0**
- [ ] Presence indicators — **DEFER to v1.0**
- [ ] Activity feed — **DEFER to v1.0**

#### Security (Baseline)
- [x] HTTPS only (TLS 1.3)
- [x] RBAC at API middleware + PostgreSQL RLS
- [x] DOMPurify for user-generated content
- [x] CSRF token on state-changing requests
- [x] Rate limiting (1000 req/hr authenticated, 100 unauthenticated)
- [x] File type validation (magic bytes on server, not extension)
- [x] S3 presigned URLs with 15-min expiry
- [x] Password reset token: single-use, 1-hour expiry, HMAC-signed
- [x] Invite token: HMAC-signed, validates signature + expiry
- [ ] Virus scanning (ClamAV) — **DEFER to v1.0**
- [ ] Encryption at rest (AWS S3 default SSE-S3 sufficient for MVP)

### 1.2 What Is Excluded (Explicit Non-Scope)

- ❌ **Real-time collaboration** — No WebSocket, Socket.io, or live cursors
- ❌ **Comments & threading** — File-level comments deferred
- ❌ **Version history** — Single version per file; new upload = replacement
- ❌ **Tagging & categorization** — No tags, no folders (flat structure)
- ❌ **Full-text search** — No Elasticsearch; basic filename filter only
- ❌ **Notifications** — No push notifications, email digest, or in-app bell
- ❌ **Activity log** — No "User X uploaded Y at Z" feed
- ❌ **Analytics & metrics** — No dashboards, no usage tracking
- ❌ **Desktop/Mobile apps** — Web only; responsive design for mobile browser
- ❌ **Content types beyond PDF/JPG/PNG** — No DOCX, PPTX, XLSX, videos, etc.
- ❌ **OAuth (Google, GitHub)** — Email/password only
- ❌ **Workspace/organization** — Single user, multiple rooms; no multi-tenant workspace concept
- ❌ **Billing** — No payment system, freemium tiers, or usage limits
- ❌ **Admin dashboard** — No super-admin panel for system management
- ❌ **3rd-party integrations** — No Zapier, Slack bots, or API marketplace
- ❌ **Dark mode** — Light mode only

---

## 2. ARCHITECTURE OVERVIEW

### 2.1 Tech Stack (Simplified from Blueprint)

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 18 + TypeScript + Vite | Core MVP doesn't need real-time, so can skip Socket.io. Zustand for UI state only. No TanStack Query (simpler state for MVP). |
| State (Client) | Zustand (UI state only) | Lightweight. Auth state, open modals, preferences. Server state fetched via basic fetch/axios. |
| Styling | Tailwind CSS + shadcn/ui | Same as blueprint. Saves design time, WCAG compliant. |
| Backend | Node.js 20 + Fastify + TypeScript | Same as blueprint. Built-in schema validation. |
| ORM | Prisma | Same as blueprint. Type-safe, auto-migrations. |
| Database | PostgreSQL 16 (RDS) | Same as blueprint. RLS for RBAC enforcement. |
| Cache | Redis (minimal) | Sessions + rate limit counters only. No pub/sub, no real-time. |
| Search | File browser only | No Elasticsearch. MVP has flat file list + basic filename filter. |
| File Storage | AWS S3 + presigned URLs | Same as blueprint. Direct client upload via presigned PUT URL. |
| Auth | Custom JWT + Lucia | Same as blueprint. RS256, 15-min access, 30-day refresh (HttpOnly). |
| Real-time | **NONE** | No Socket.io, no WebSocket. Polling acceptable if needed. |
| Infrastructure | AWS ECS Fargate + RDS | Simplified: single API service + single Worker service. No need for separate Realtime server. |
| CI/CD | GitHub Actions | Same as blueprint. Docker build → ECR → ECS deploy. |
| Monitoring | Sentry (errors) + basic CloudWatch | Minimal observability. Upgrade in v1.0. |

**Key Simplifications:**
- No Elasticsearch (search = client-side filter on filename)
- No Socket.io (file page refreshed manually or via polling)
- No Lambda workers (process jobs synchronously or via simple SQS consumer)
- Redis used only for sessions + rate limits (not pub/sub)
- Single API instance (no horizontal scaling complexity yet)
- No Datadog APM (Sentry + CloudWatch sufficient)

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────┐
│         WEB BROWSER (React 18 + TS)     │
│  Login | Dashboard | Room View | Upload │
└──────────────────┬──────────────────────┘
                   │ HTTPS
         ┌─────────▼──────────┐
         │  AWS ALB / API GW  │
         └─────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  API SERVER (1-2)   │
        │  Fastify + Node.js  │
        │  - Auth handlers    │
        │  - Room CRUD        │
        │  - File upload/DL   │
        │  - RBAC middleware  │
        └──────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐   ┌─────▼────┐   ┌────▼──┐
│  PG   │   │   Redis  │   │  S3   │
│ (RDS) │   │ Sessions │   │ Files │
│  RLS  │   │  & Rate  │   │       │
└───────┘   │  Limits  │   └───────┘
            └──────────┘
```

---

## 3. DATABASE SCHEMA (MVP)

### 3.1 Core Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `rooms`
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(8) UNIQUE NOT NULL, -- alphanumeric, auto-generated
  name VARCHAR(255) NOT NULL,
  description TEXT,
  password_hash TEXT, -- nullable if not password-protected
  created_by UUID NOT NULL REFERENCES users(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_slug ON rooms(slug);
CREATE INDEX idx_rooms_created_by ON rooms(created_by);
```

#### `room_members`
```sql
CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'viewer')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
```

#### `invite_links`
```sql
CREATE TABLE invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL, -- HMAC-signed payload
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP,
  is_single_use BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP, -- populated on first use (if single_use)
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invite_links_room_id ON invite_links(room_id);
CREATE INDEX idx_invite_links_token ON invite_links(token);
```

#### `content_items`
```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('pdf', 'image')),
  title VARCHAR(255) NOT NULL,
  storage_key TEXT NOT NULL, -- S3 key: rooms/{room_id}/{content_id}/{filename}
  file_size_bytes INT NOT NULL,
  mime_type VARCHAR(100),
  metadata JSONB, -- { width, height } for images, etc.
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_items_room_id ON content_items(room_id);
CREATE INDEX idx_content_items_created_by ON content_items(created_by);
CREATE INDEX idx_content_items_type ON content_items(type);
```

#### `password_reset_tokens`
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL, -- HMAC-signed, single-use
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP, -- null until used
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

#### `email_verification_tokens`
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
```

### 3.2 Row-Level Security (RLS) Policies

**Policy: Users can only see rooms they're members of**
```sql
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY room_members_select ON room_members
  FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM room_members WHERE user_id = current_user_id()
    )
  );
```

**Policy: Users can only see content in rooms they're members of**
```sql
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_items_select ON content_items
  FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM room_members WHERE user_id = current_user_id()
    )
  );

CREATE POLICY content_items_insert ON content_items
  FOR INSERT
  WITH CHECK (
    created_by = current_user_id() AND
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = content_items.room_id
        AND user_id = current_user_id()
        AND role = 'admin'
    )
  );

CREATE POLICY content_items_delete ON content_items
  FOR DELETE
  USING (
    created_by = current_user_id() AND
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = content_items.room_id
        AND user_id = current_user_id()
        AND role = 'admin'
    )
  );
```

---

## 4. API ENDPOINTS (MVP)

### 4.1 Authentication

#### `POST /api/v1/auth/signup`
Request:
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!",
  "displayName": "Alice"
}
```
Response (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "alice@example.com",
    "displayName": "Alice"
  },
  "accessToken": "eyJhbGc...",
  "message": "Verification email sent. Check your inbox."
}
```
- Sends verification email with time-limited link
- Password hashed with bcrypt (cost 12)
- Refresh token set in HttpOnly cookie

#### `POST /api/v1/auth/login`
Request:
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```
Response (200):
```json
{
  "user": { "id": "uuid", "email", "displayName" },
  "accessToken": "eyJhbGc..."
}
```
- Refresh token set in HttpOnly cookie

#### `POST /api/v1/auth/logout`
Response (200):
```json
{ "message": "Logged out successfully" }
```
- Clears refresh token cookie
- Adds access token to Redis blacklist (optional for MVP)

#### `POST /api/v1/auth/refresh`
Response (200):
```json
{
  "accessToken": "eyJhbGc...",
  "user": { "id", "email", "displayName" }
}
```
- Issues new access token if refresh token valid

#### `POST /api/v1/auth/verify-email`
Query: `?token={token}`
Response (200):
```json
{ "message": "Email verified" }
```
- Marks user.email_verified = true
- Consumes one-time token

#### `POST /api/v1/auth/forgot-password`
Request:
```json
{ "email": "alice@example.com" }
```
Response (200):
```json
{ "message": "Password reset email sent if account exists" }
```
- Sends email with reset link (even if account doesn't exist, same response for security)

#### `POST /api/v1/auth/reset-password`
Query: `?token={token}`
Request:
```json
{ "password": "NewPassword123!" }
```
Response (200):
```json
{ "message": "Password reset successfully" }
```
- Validates token, hashes new password, consumes token

### 4.2 Rooms

#### `GET /api/v1/rooms`
Response (200):
```json
{
  "rooms": [
    {
      "id": "uuid",
      "slug": "abc12xyz",
      "name": "Q1 Planning",
      "description": "Q1 roadmap docs",
      "memberCount": 3,
      "createdBy": { "id", "displayName", "avatarUrl" },
      "createdAt": "2026-05-04T10:00:00Z",
      "myRole": "admin"
    }
  ]
}
```
- Returns rooms user is a member of
- Enforced by RLS

#### `POST /api/v1/rooms`
Request:
```json
{
  "name": "Q1 Planning",
  "description": "Q1 roadmap docs",
  "password": "RoomSecret123" // optional
}
```
Response (201):
```json
{
  "room": {
    "id": "uuid",
    "slug": "abc12xyz",
    "name": "Q1 Planning",
    "description": "Q1 roadmap docs",
    "hasPassword": true,
    "createdAt": "2026-05-04T10:00:00Z"
  },
  "message": "Room created. You are the admin."
}
```
- Auto-generates unique 8-char slug
- Creator becomes admin
- Auto-joins creator as room_members row

#### `GET /api/v1/rooms/:id`
Response (200):
```json
{
  "room": {
    "id": "uuid",
    "slug": "abc12xyz",
    "name": "Q1 Planning",
    "description": "Q1 roadmap docs",
    "hasPassword": true,
    "memberCount": 3,
    "createdBy": { "id", "displayName" },
    "createdAt": "2026-05-04T10:00:00Z",
    "myRole": "admin"
  },
  "members": [
    { "id": "uuid", "displayName", "email", "role": "admin", "joinedAt": "..." },
    { "id": "uuid", "displayName", "email", "role": "viewer", "joinedAt": "..." }
  ]
}
```
- Requires room membership (RLS enforced)

#### `PUT /api/v1/rooms/:id`
Request:
```json
{
  "name": "Q1 Planning (Updated)",
  "description": "New description"
}
```
Response (200):
```json
{
  "room": { "id", "slug", "name", "description", "updatedAt" }
}
```
- Admin only (checked in middleware)

#### `DELETE /api/v1/rooms/:id`
Response (204):
```
(empty)
```
- Admin only
- Cascade deletes: room_members, content_items, invite_links, etc.

### 4.3 Invite Links

#### `POST /api/v1/rooms/:id/invites`
Request:
```json
{
  "role": "viewer",
  "expiresIn": "7d", // "24h" | "7d" | "30d" | "never"
  "isSingleUse": false
}
```
Response (201):
```json
{
  "invite": {
    "id": "uuid",
    "token": "abc12xyz_hmac...",
    "url": "https://nexus.app/join/abc12xyz?token=abc12xyz_hmac...",
    "expiresAt": "2026-05-11T10:00:00Z",
    "isSingleUse": false,
    "role": "viewer"
  }
}
```
- Admin only
- Token is HMAC-SHA256 signed with server secret

#### `GET /api/v1/rooms/:id/invites`
Response (200):
```json
{
  "invites": [
    {
      "id": "uuid",
      "token": "abc...",
      "url": "https://...",
      "expiresAt": "2026-05-11T10:00:00Z",
      "isSingleUse": false,
      "isRevoked": false,
      "usedAt": null,
      "role": "viewer",
      "createdBy": { "id", "displayName" },
      "createdAt": "2026-05-04T10:00:00Z"
    }
  ]
}
```
- Admin only
- Lists all invite links for room (including revoked)

#### `POST /api/v1/join`
Query: `?roomId=abc12xyz&token=abc12xyz_hmac...`
Request:
```json
{
  "password": "RoomSecret123", // if room is password-protected
  "createAccount": false // if true, also provision account
}
```
Response (200):
```json
{
  "room": { "id", "slug", "name", "description", "memberCount", "createdAt" },
  "accessToken": "eyJhbGc...",
  "message": "Welcome to the room!"
}
```
- No auth required
- Validates invite token (signature + expiry + single-use + revoked)
- Auto-creates room_members row or updates if user already member
- If createAccount=true and user is guest, signs them up first (optional for MVP)

#### `POST /api/v1/rooms/:id/invites/:inviteId/revoke`
Response (200):
```json
{ "message": "Invite revoked" }
```
- Admin only
- Sets is_revoked = true

#### `POST /api/v1/rooms/:id/invites/revoke-all`
Response (200):
```json
{ "message": "All invites revoked" }
```
- Admin only
- Sets is_revoked = true for all invites in room

### 4.4 Room Members

#### `GET /api/v1/rooms/:id/members`
Response (200):
```json
{
  "members": [
    { "id": "uuid", "displayName", "email", "role": "admin", "joinedAt": "..." },
    { "id": "uuid", "displayName", "email", "role": "viewer", "joinedAt": "..." }
  ]
}
```
- Any room member can view

#### `PUT /api/v1/rooms/:id/members/:userId`
Request:
```json
{ "role": "admin" } // or "viewer"
```
Response (200):
```json
{ "member": { "id", "displayName", "role", "updatedAt" } }
```
- Admin only

#### `DELETE /api/v1/rooms/:id/members/:userId`
Response (204):
```
(empty)
```
- Admin only
- Removes room_members row

### 4.5 File Content

#### `GET /api/v1/rooms/:id/content`
Query: `?type=pdf&type=image&sort=created_at&order=desc`
Response (200):
```json
{
  "content": [
    {
      "id": "uuid",
      "type": "pdf",
      "title": "Design Spec v1.pdf",
      "fileSizeBytes": 2048576,
      "mimeType": "application/pdf",
      "createdBy": { "id", "displayName", "avatarUrl" },
      "createdAt": "2026-05-04T10:00:00Z",
      "uploadedAt": "2026-05-04T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "image",
      "title": "Screenshot.png",
      "fileSizeBytes": 512000,
      "mimeType": "image/png",
      "metadata": { "width": 1920, "height": 1080 },
      "createdBy": { "id", "displayName", "avatarUrl" },
      "createdAt": "2026-05-04T10:00:00Z"
    }
  ],
  "total": 2,
  "pagination": { "page": 1, "perPage": 50 }
}
```
- Any room member can view
- RLS enforced

#### `POST /api/v1/rooms/:id/content/presign`
Request:
```json
{
  "filename": "Design Spec v1.pdf",
  "mimeType": "application/pdf",
  "fileSizeBytes": 2048576
}
```
Response (200):
```json
{
  "uploadId": "uuid",
  "presignedUrl": "https://s3.amazonaws.com/nexus-uploads/...",
  "expiresIn": 3600,
  "fields": {
    "key": "rooms/room-uuid/content-uuid/Design Spec v1.pdf",
    "acl": "private"
  }
}
```
- Admin only (middleware check)
- Validates: file type allowed, size < 50MB
- Returns presigned S3 PUT URL (valid 1 hour)

#### `POST /api/v1/rooms/:id/content`
Request:
```json
{
  "uploadId": "uuid", // from presign response
  "filename": "Design Spec v1.pdf",
  "title": "Design Spec v1", // optional; defaults to filename without extension
  "mimeType": "application/pdf",
  "fileSizeBytes": 2048576
}
```
Response (201):
```json
{
  "content": {
    "id": "uuid",
    "type": "pdf",
    "title": "Design Spec v1",
    "fileSizeBytes": 2048576,
    "mimeType": "application/pdf",
    "createdBy": { "id", "displayName" },
    "createdAt": "2026-05-04T10:00:00Z",
    "storageKey": "rooms/room-uuid/content-uuid/Design Spec v1.pdf"
  },
  "message": "File uploaded successfully"
}
```
- Admin only
- Validates uploadId, creates content_items row, stores metadata
- For images: can extract width/height and store in metadata.JSONB

#### `GET /api/v1/content/:id/download`
Response (302 or 200):
```
{
  "downloadUrl": "https://s3.amazonaws.com/nexus-uploads/... (presigned GET URL, 15-min expiry)"
}
```
- Any room member with access to content
- Returns presigned S3 GET URL (can be 302 redirect or 200 with URL in body)
- RLS enforces room membership

#### `DELETE /api/v1/content/:id`
Response (204):
```
(empty)
```
- Admin only
- Sets is_deleted = true (soft delete for MVP; no hard delete)
- Alternatively: hard delete S3 object immediately

---

## 5. UI FLOWS & SCREENS (MVP)

### 5.1 User Journeys

#### Journey 1: Signup → Create Room → Invite → Upload
1. User opens app → sees landing page with "Sign Up" / "Log In" / "Join Room"
2. Click "Sign Up" → Email/Password/Name form → Submit
3. Verification email sent → User clicks link → Account verified
4. Redirected to Dashboard (empty "My Rooms" state)
5. Click "Create Room" → Modal: name, description, password (optional) → Create
6. Room created, user lands on Room View
7. Click "Invite Members" → Modal: role selector, expiry, generate link → Copy link
8. Share link with colleagues
9. Click "+ Add Files" → Upload modal: drag-drop PDF or image → File uploaded
10. Room view shows file card in grid

#### Journey 2: Guest Accept Invite → No Signup
1. User receives invite link (e.g., nexus.app/join/abc12xyz?token=...)
2. Click link → Join page shows: room name, password input (if protected)
3. Enter password (if needed) → Accept
4. Instant access to Room View as Viewer (read-only)
5. Optional banner: "Create account to save access" (optional for MVP)

#### Journey 3: Login → View Existing Room → Download
1. User opens app → Login form → Email + password → Submit
2. Redirected to Dashboard → Shows "Recent Rooms"
3. Click room card → Room View loads
4. Click file card → Preview modal opens (PDF or image viewer)
5. Click "Download" → Presigned URL opens in new tab → File downloads

### 5.2 Key Screens (Wireframe Descriptions)

#### Screen 1: Landing Page / Login
- Header: "Nexus Rooms" logo
- Two tabs: "Log In" | "Sign Up"
- Log In form: email, password, "Log In" button, "Forgot password?" link
- Sign Up form: display name, email, password (with strength meter), "Sign Up" button
- Bottom: "Don't have an account?" (tab switcher)
- Footer: "Join a room without account" link (for guests following invite links)

#### Screen 2: Dashboard
- Left sidebar (desktop) / Bottom nav (mobile): "Nexus Rooms" logo, user avatar + name, "New Room" button, Settings link
- Main content: Welcome header "Hi Alice", "Your Rooms" section
- Room cards (grid): Cover color/emoji (optional for MVP), room name, member count, "Created 3 days ago"
- Actions on room card: Click to open → or right-click for "Leave Room" (if not creator)
- Empty state: "No rooms yet. Create one or join via link." + two buttons: "New Room" | "Join Room"
- Top bar (desktop): Global notification icon, user menu (Settings, Logout)

#### Screen 3: Room View
- Top bar: Room name, member count (clickable to see list), "Add Files" button, Settings icon
- Sidebar (desktop) / Drawer (mobile): Folder placeholder (empty for MVP; prepare structure for v1.0), "Members" section with list
- Main content: File grid or list (toggle)
- File card (grid): Thumbnail (PDF icon or image preview), filename, file size, uploader name, upload date
- File card (list): Same info but horizontal layout
- Empty state: "No files yet. Drop or click to upload."
- Mobile: Bottom floating "Add" FAB (green plus button)

#### Screen 4: Upload Modal
- Header: "Add Files to Room"
- Drop zone (large, dashed border): "Drop PDFs or images here (max 50 MB each)"
- Browse button: "or click to select files"
- File input: multiple file selection
- Progress bar (per file during upload): filename, bytes uploaded / total
- On success: File card appears in room view instantly (no refresh needed)
- Error toast: "File must be PDF or JPG/PNG"
- Cancel button

#### Screen 5: File Preview Modal
- Header: Filename, file size, uploader, upload date
- Main content:
  - **PDF**: Embed PDF.js viewer (page navigation, zoom controls, download button)
  - **Image**: Full-res image, zoom/pan, download button
- Close button (X)
- "Download" button (presigned URL)
- Mobile: Full-screen modal, minimize to see room view behind

#### Screen 6: Room Settings
- Tab or expandable section: "Room Settings"
- Form fields (admin only):
  - Room name (text input)
  - Description (textarea)
  - Password (optional, changeable)
  - Delete room button (admin only, red, with confirmation)
- Section: "Invite Links"
  - List of active invites (token, role, expiry, actions)
  - "+ Generate Invite" button
  - Actions: Copy link, Revoke, Edit expiry
- Section: "Members"
  - List: name, email, role, joined date
  - Actions: Remove member, change role (if admin)
- Only admin can edit; viewers see read-only view

#### Screen 7: Join Room (Guest Flow)
- Header: "Join Room"
- Room info card: room name, member count, "Invite required to access"
- Password input (if room is password-protected)
- "Join as Guest" button (or "Create Account & Join" button if we support signup on this screen for MVP)
- Error message if password incorrect or link expired

### 5.3 Responsive Breakpoints
- **Mobile**: 375px–767px (single-column layout, bottom tab nav, full-screen modals as bottom sheets)
- **Tablet**: 768px–1024px (flexible 2-column, adaptive spacing)
- **Desktop**: 1025px–1440px (full-featured UI, left sidebar, side panels)

---

## 6. SECURITY & COMPLIANCE (MVP)

### 6.1 Authentication & Authorization
- ✓ JWT with RS256 (asymmetric signing)
- ✓ Access token: 15 min expiry
- ✓ Refresh token: 30 days, HttpOnly cookie, SameSite=Strict
- ✓ Password hashing: bcrypt (cost 12)
- ✓ RBAC at API middleware + PostgreSQL RLS
- ✓ Email verification required before room creation
- ✓ Password reset token: single-use, 1-hour, HMAC-signed

### 6.2 Data Protection
- ✓ HTTPS / TLS 1.3 enforced
- ✓ S3 presigned URLs: 15-min expiry for downloads, 1-hour for uploads
- ✓ File type validation: magic bytes on server, not extension
- ✓ DOMPurify on all user input renders
- ✓ CSRF token on state-changing POST/PUT/DELETE (optional for MVP if SameSite cookie sufficient)

### 6.3 Attack Surface
- ✓ Rate limiting: 1000 req/hour authenticated, 100 unauthenticated per IP
- ✓ Brute force protection: 5 failed login attempts → 60-second lockout
- ✓ Invite link tampering: HMAC-SHA256 validation
- ✓ SQL injection: Prisma parameterized queries only
- ✓ XSS: React JSX auto-escaping + DOMPurify
- ✗ Virus scanning: **DEFER to v1.0** (not MVP-critical)

### 6.4 Compliance
- ✓ WCAG 2.1 AA accessibility (keyboard nav, ARIA labels, contrast)
- ✓ HTTPS only
- ✗ GDPR data export / deletion: **DEFER to v1.0** (legal requirement, not MVP value)
- ✗ SOC 2 audit: **DEFER to v1.0**

---

## 7. DEVELOPMENT ROADMAP

### Phase 1: MVP (8–10 weeks)
**Goal:** Functional file sharing, core RBAC, clean code

**Week 1–2: Setup & Auth**
- [ ] PostgreSQL + Prisma schema
- [ ] JWT + refresh token flow
- [ ] Email verification (mock or AWS SES)
- [ ] Password reset flow
- [ ] Login/signup API + Fastify routes

**Week 3: Rooms & Invites**
- [ ] Room CRUD endpoints
- [ ] Invite link generation + token signing
- [ ] Join room flow (guest + auth)
- [ ] Room settings API

**Week 4: File Upload & Storage**
- [ ] S3 presigned PUT/GET URLs
- [ ] File upload endpoint (metadata + S3 key)
- [ ] Download endpoint
- [ ] File list endpoint

**Week 5: Frontend Setup**
- [ ] React 18 + Vite scaffold
- [ ] Zustand store (auth + UI state)
- [ ] Tailwind + shadcn/ui component library
- [ ] Basic routing (Login, Dashboard, Room, Settings)

**Week 6: Frontend Auth & Dashboard**
- [ ] Login/signup forms
- [ ] JWT token management (store, refresh)
- [ ] Dashboard screen (room list + create room modal)
- [ ] Protected routes

**Week 7: Frontend Room & Upload**
- [ ] Room view (file grid/list)
- [ ] Upload modal (drag-drop)
- [ ] File preview (basic PDF.js + image viewer)
- [ ] Download functionality

**Week 8: Frontend Settings & Members**
- [ ] Room settings screen
- [ ] Invite link management UI
- [ ] Member list + role management

**Week 9: Mobile Responsive + Polish**
- [ ] Mobile layout (bottom nav, responsive grid)
- [ ] Touch interactions (FAB, swipe drawer)
- [ ] Bug fixes + UX polish

**Week 10: Testing & Deployment**
- [ ] Unit tests (Jest) for auth, rooms, files
- [ ] Integration tests (Playwright) for critical flows
- [ ] Deploy to AWS (RDS + ECS + S3)
- [ ] Launch & monitor

### Phase 2: v1.0 (12–16 weeks after MVP)
**Goal:** Full blueprint features

- [ ] Real-time collaboration (Socket.io)
- [ ] Comments & threading
- [ ] Version history
- [ ] Full-text search (Elasticsearch)
- [ ] Tagging & folders
- [ ] Activity feed & notifications
- [ ] OAuth (Google, GitHub)
- [ ] Desktop & mobile apps (Electron + React Native)
- [ ] Virus scanning (ClamAV)
- [ ] Analytics dashboard

### Phase 3: v1.5 (Post-launch)
- [ ] Workspace concept (multi-user teams)
- [ ] Advanced RBAC (custom roles)
- [ ] Billing & freemium tiers
- [ ] Integrations (Slack, Zapier)
- [ ] SSO (SAML, OpenID Connect)

---

## 8. DEPLOYMENT & OPERATIONS (MVP)

### 8.1 Infrastructure
- **Database**: AWS RDS PostgreSQL 16, Multi-AZ, automated backups
- **API Server**: AWS ECS Fargate, 2 tasks (failover), auto-scale on CPU > 70%
- **Cache**: AWS ElastiCache Redis 7, single node (sufficient for MVP)
- **File Storage**: AWS S3, private bucket, lifecycle policy (delete after 90 days)
- **CDN**: CloudFront (optional for MVP; can add later)
- **DNS**: Route 53 (or external DNS)
- **TLS**: AWS Certificate Manager (free, auto-renew)

### 8.2 CI/CD
- **GitHub Actions** workflow:
  1. PR: TypeScript check → ESLint → Jest tests → build Docker image → push to ECR
  2. Merge to main: Docker push → ECS rolling deploy (1 new task at a time)
  3. Healthcheck after deploy (smoke test)

### 8.3 Monitoring & Alerting
- **Error tracking**: Sentry (frontend + backend)
- **Logs**: CloudWatch + Pino structured logs
- **Metrics**: CloudWatch (CPU, memory, RDS latency)
- **Uptime**: Route 53 health checks
- **Alerts**: SNS → email / Slack on critical issues

### 8.4 Database Migrations
- Prisma migrations (version-controlled in git)
- Auto-run migrations on ECS container startup (via entrypoint script)
- Rollback: Previous RDS snapshot if needed

---

## 9. SUCCESS CRITERIA & METRICS

### Launch Goals (MVP End-of-Life)
- [ ] 100 beta users sign up
- [ ] 40% activation rate (create or join room within first session)
- [ ] Median time-to-upload: < 90 seconds from login
- [ ] 95% of uploads succeed on first attempt
- [ ] Zero data loss or file corruption
- [ ] p95 API latency: < 500ms (relaxed from blueprint's < 200ms)
- [ ] 99% uptime (relaxed from blueprint's 99.9% for MVP)
- [ ] No critical security incidents

### Quality Gates
- [ ] All authentication flows tested (Jest + Playwright)
- [ ] All RBAC policies tested (unit + integration)
- [ ] Upload/download resilience tested (network interruption scenarios)
- [ ] WCAG 2.1 AA accessibility audit passed
- [ ] Zero XSS/CSRF/injection vulnerabilities in OWASP top 10
- [ ] Code coverage: ≥ 70% for auth, rooms, files modules

---

## 10. TECHNICAL DECISIONS & RATIONALE

### Why JWT over Session Cookies?
- **Pro**: Stateless (no session DB queries), easy horizontal scaling, suitable for future mobile apps
- **Con**: Token size, refresh complexity
- **MVP Decision**: JWT because future v1.0 requires mobile apps (React Native) where session cookies are awkward; establish pattern now

### Why No Real-time WebSocket?
- **Pro**: Simpler architecture, fewer moving parts, easier debugging
- **Con**: Users must refresh to see new files; less snappy feel
- **MVP Decision**: Acceptable tradeoff. Users can refresh or polling can be added later. Real-time is v1.0 feature.

### Why Flat File Structure (No Folders)?
- **Pro**: Simpler data model, faster query, fewer schema changes
- **Con**: Limited organization for large file sets
- **MVP Decision**: v1.0 adds nested folders + tagging. MVP just uses "All Content" flat list with filename search.

### Why Single-Service Architecture?
- **Pro**: Simpler deployment, fewer services to manage, fast iteration
- **Con**: Horizontal scaling hits DB connection limits sooner
- **MVP Decision**: Sufficient for launch. v1.0 decomposes into Auth, Rooms, Content, Realtime services if needed.

### Why No Elasticsearch?
- **Pro**: Simpler ops, fewer services, lower cost
- **Con**: Client-side filtering slower, no relevance ranking
- **MVP Decision**: MVP has flat file list + client-side filename filter. v1.0 adds ES for full-text search across file content.

### Why Presigned S3 URLs?
- **Pro**: Direct client → S3 upload (bypasses API bandwidth), secure (token-based, time-limited)
- **Con**: More complex client code
- **MVP Decision**: Scales to 100+ concurrent uploads without API bottleneck. Worth the complexity.

---

## 11. KNOWN LIMITATIONS & FUTURE ENHANCEMENTS

### MVP Limitations
1. **No real-time updates**: Users don't see new files until they refresh
2. **No comments**: File-level collaboration is async (email, Slack, etc.)
3. **No versioning**: Uploading new file with same name replaces old one
4. **No search**: Only filename filter (case-insensitive substring)
5. **No media types**: Only PDF, JPG, PNG (no DOCX, videos, etc.)
6. **No desktop/mobile apps**: Web only (but responsive)
7. **No advanced RBAC**: Only 2 roles; no custom permissions
8. **No analytics**: No insights into usage, engagement, etc.

### Transition to v1.0
- **Real-time sync**: Add Socket.io with Redis adapter → all screens auto-update
- **Comments**: Add comments table, notification system
- **Version history**: Add content_versions table, restore/compare UI
- **Search**: Add Elasticsearch, integrate into filter UI
- **Media types**: Expand file upload validation, add media previews
- **Desktop/Mobile**: Scaffold Electron + React Native apps, share types/api-client packages
- **Advanced RBAC**: Add custom roles, permission matrix
- **Analytics**: Add activity log table, dashboards

---

## 12. APPENDIX: MVP TECH STACK SUMMARY

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Frontend Framework | React | 18 | TypeScript throughout |
| Build Tool | Vite | 5.x | Sub-second HMR |
| State Management | Zustand | 4.x | UI state; no TanStack Query for MVP |
| Styling | Tailwind CSS | 3.x | Utility-first |
| UI Components | shadcn/ui | Latest | Radix + Tailwind primitives |
| Backend Runtime | Node.js | 20 LTS | TypeScript via tsx/tsup |
| Framework | Fastify | 4.x | Built-in JSON schema validation |
| ORM | Prisma | 5.x | Type-safe queries, migrations |
| Database | PostgreSQL | 16 | AWS RDS Multi-AZ |
| Cache | Redis | 7 | AWS ElastiCache, sessions + rate limits only |
| File Storage | AWS S3 | - | Presigned URLs, private bucket |
| Auth Library | Lucia Auth | Latest | Session + JWT management |
| Password Hashing | bcrypt | 5.x | cost=12 |
| HTTP Client | fetch (native) | - | No axios/superagent for MVP |
| Testing (Unit) | Jest | 29.x | TypeScript support |
| Testing (E2E) | Playwright | 1.x | Subset for MVP (login, upload, download) |
| Docker | alpine (Node) | 20-alpine | Multi-stage builds, < 150 MB images |
| CI/CD | GitHub Actions | - | PR + deploy workflows |
| Monitoring | Sentry | - | Error tracking only (not APM for MVP) |
| Logging | Pino | 8.x | Structured JSON logs |

---

## GLOSSARY

- **Room**: A private space where users collaborate on files. Created by admin, joined via ID or invite.
- **Admin**: Role with upload, delete, member management, room settings permissions.
- **Viewer**: Role with view and download permissions only.
- **Invite Link**: Time-limited, HMAC-signed URL that grants access to a room without account requirement.
- **Presigned URL**: S3 URL with embedded credentials, time-limited, used for direct client → S3 upload/download.
- **JWT**: JSON Web Token, stateless auth credential, signed with RS256.
- **RLS**: PostgreSQL Row-Level Security, database-level access control.
- **RMS**: Room Members, the junction table defining user → room membership + role.

---

## FINAL NOTES

This MVP specification is designed to be **buildable in 8–10 weeks** with a focused team while maintaining **clean architecture** and a **clear upgrade path** to the full blueprint. Every technology decision is justified for MVP constraints (simplicity, speed, cost) while not creating technical debt that blocks v1.0 features.

The emphasis is on **shipping core value** (file sharing + basic RBAC) over perfectionism. Non-MVP features are explicitly deferred, not abandoned.

**Next Steps:**
1. Validate this scope with stakeholders (product, design, engineering)
2. Set up development environment (Node, Docker, PostgreSQL locally)
3. Begin Week 1 (PostgreSQL schema + Auth API)
4. Weekly sync to track progress against roadmap

---

**Document Version:** 1.0-MVP  
**Last Updated:** May 2026  
**Owner:** Senior Product Architect (Nexus Rooms)  
**Status:** Ready for Development

