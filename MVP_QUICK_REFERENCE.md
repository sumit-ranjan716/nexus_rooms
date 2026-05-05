# NEXUS ROOMS MVP — QUICK REFERENCE & CHEAT SHEET

## At a Glance

| Aspect | Details |
|--------|---------|
| **Product** | Private room-based file sharing (PDF + images only) |
| **Timeline** | 8–10 weeks, 2–3 full-stack engineers |
| **Launch Goal** | 100 beta users, 40% activation, < 90s to first upload |
| **Tech Stack** | React 18 + Fastify + PostgreSQL + S3 (see full spec) |
| **Roles** | Admin (upload/delete), Viewer (read-only) |
| **File Types** | PDF, JPG, PNG (max 50 MB each) |

---

## Database Tables (7 Core)

```sql
users
├─ id, email (unique), password_hash, display_name, avatar_url, email_verified, created_at
├ rooms
│  ├─ id, slug (unique, 8-char), name, description, password_hash (nullable), created_by, is_deleted, created_at
├─ room_members
│  ├─ id, room_id, user_id, role (admin|viewer), joined_at [UNIQUE(room_id, user_id)]
├─ invite_links
│  ├─ id, room_id, token (unique, HMAC), role, created_by, expires_at, is_single_use, used_at, is_revoked, created_at
├─ content_items
│  ├─ id, room_id, created_by, type (pdf|image), title, storage_key (S3), file_size_bytes, mime_type, metadata (JSONB), is_deleted, created_at
├─ password_reset_tokens
│  ├─ id, user_id, token (unique, HMAC), expires_at, used_at, created_at [single-use, 1hr]
├─ email_verification_tokens
   ├─ id, user_id, token (unique), expires_at, created_at
```

**RLS Policies:**
- Users see only rooms they're members of
- Users see only content in rooms they're members of
- Admins can insert/delete content; viewers cannot

---

## Core API Routes (/api/v1/)

### Auth (6 endpoints)
```
POST /auth/signup              → JWT + refresh cookie
POST /auth/login               → JWT + refresh cookie
POST /auth/logout              → clear cookie
POST /auth/refresh             → new JWT
POST /auth/verify-email        → mark verified (single-use token)
POST /auth/forgot-password     → send reset link
POST /auth/reset-password      → new password (single-use token)
```

### Rooms (6 endpoints)
```
GET  /rooms                    → user's rooms (RLS enforced)
POST /rooms                    → create room, creator = admin
GET  /rooms/:id                → room detail + members
PUT  /rooms/:id                → update name/desc (admin only)
DELETE /rooms/:id              → cascade delete (admin only)
GET  /rooms/:id/members        → member list
```

### Invites (6 endpoints)
```
POST /rooms/:id/invites                  → generate invite link (admin only)
GET  /rooms/:id/invites                  → list invites (admin only)
POST /rooms/:id/invites/:inviteId/revoke → revoke one (admin only)
POST /rooms/:id/invites/revoke-all       → revoke all (admin only)
POST /join                               → join room via token (no auth required)
PUT  /rooms/:id/members/:userId          → change role (admin only)
```

### Content Files (4 endpoints)
```
GET  /rooms/:id/content                  → list files (any member)
POST /rooms/:id/content/presign          → get S3 PUT URL (admin only)
POST /rooms/:id/content                  → register uploaded file (admin only)
GET  /content/:id/download               → get S3 GET URL (any member)
```

### Member Management (1 endpoint)
```
DELETE /rooms/:id/members/:userId        → remove member (admin only)
```

---

## File Upload Flow

```
1. Admin clicks "Add Files"
   ↓
2. POST /rooms/:id/content/presign
   ← { presignedUrl, uploadId, fields, expiresIn: 3600 }
   ↓
3. Client uploads directly to S3 via presigned PUT URL
   (bypasses API, no bandwidth cost)
   ↓
4. On success, POST /rooms/:id/content
   (register file in DB)
   ↓
5. content_items row created
   ↓
6. Room view updates instantly (or on refresh)
```

---

## Authentication Architecture

```
Signup Flow:
  1. POST /auth/signup (email, password, displayName)
  2. Hash password with bcrypt (cost 12)
  3. Send verification email with token (1-hour expiry)
  4. User clicks link → POST /auth/verify-email?token=...
  5. User marked verified, ready to create rooms

Login Flow:
  1. POST /auth/login (email, password)
  2. Validate password vs bcrypt hash
  3. Issue JWT (RS256, 15-min access token)
  4. Issue refresh token (30-day, HttpOnly, SameSite=Strict)
  5. Return JWT in response

Token Refresh:
  1. Client sends refresh cookie
  2. POST /auth/refresh
  3. Validate refresh token in Redis (not blacklisted)
  4. Issue new JWT + new refresh token
  5. Rotate refresh token (old one invalidated)

Logout:
  1. POST /auth/logout
  2. Clear refresh cookie
  3. Optionally add JWT to Redis blacklist (for extra security)
```

---

## RBAC Permission Matrix

| Action | Admin | Viewer |
|--------|:-----:|:------:|
| View files | ✓ | ✓ |
| Download files | ✓ | ✓ |
| Upload files | ✓ | ✗ |
| Delete files | ✓ | ✗ |
| Manage members | ✓ | ✗ |
| Generate invites | ✓ | ✗ |
| Edit room settings | ✓ | ✗ |
| Delete room | ✓ | ✗ |
| Comment (v1.0) | ✓ | ✓ |

---

## Invite Link Flow

### Generate Link (Admin)
```
POST /rooms/:id/invites
{
  "role": "viewer",
  "expiresIn": "7d",         // "24h", "7d", "30d", "never"
  "isSingleUse": false
}

Response:
{
  "url": "https://app.nexus/join/abc12xyz?token=HMAC_SIGNATURE...",
  "expiresAt": "2026-05-11T...",
  "isSingleUse": false
}
```

### Accept Link (Guest or Auth)
```
POST /join?roomId=abc12xyz&token=HMAC_SIGNATURE...
{
  "password": "RoomSecret123",  // if password-protected
  "createAccount": false         // optional
}

Server-side validation:
  1. Parse token → extract { roomId, role, expiry, nonce }
  2. Verify HMAC signature (reject if tampered)
  3. Check expiry timestamp
  4. Check is_revoked flag
  5. If is_single_use && used_at != null: reject
  6. If room is password-protected: verify password hash
  7. Create/update room_members row
  8. Issue JWT + refresh token
```

---

## Screen Checklist (7 Key Screens)

- [ ] **Login/Signup** — email, password, name form; verify email flow
- [ ] **Dashboard** — room list, create room button, join room link
- [ ] **Room View** — file grid/list, upload button, member panel
- [ ] **Upload Modal** — drag-drop zone, file type validation, progress bar
- [ ] **File Preview** — PDF.js viewer + image viewer, download button
- [ ] **Room Settings** — name/desc edit, invite management, member list, delete room
- [ ] **Join Invite** — room info, password input (if protected), join button

---

## RBAC Enforcement (2-Layer)

### Layer 1: API Middleware
```typescript
// Pseudocode
app.post('/rooms/:id/content', authenticateJWT, async (req, res) => {
  const userRole = await getRoomRole(req.user.id, req.params.id);
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can upload' });
  }
  // ... upload logic
});
```

### Layer 2: PostgreSQL RLS
```sql
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
```

**Result:** Even if API middleware is bypassed, database rejects unauthorized writes.

---

## Security Quick-Checks

- ✓ **Passwords**: bcrypt(password, cost=12)
- ✓ **JWT**: RS256 (asymmetric), 15-min access, 30-day refresh
- ✓ **Refresh Token**: HttpOnly cookie, SameSite=Strict
- ✓ **S3 URLs**: Presigned, 15-min download expiry, 1-hour upload expiry
- ✓ **Invite Tokens**: HMAC-SHA256 signed, expiry + single-use validation
- ✓ **Password Reset**: HMAC-signed, single-use, 1-hour expiry
- ✓ **File Type**: Magic bytes on server, not extension
- ✓ **XSS**: DOMPurify on renders + React JSX escaping
- ✓ **CSRF**: SameSite cookie + optional CSRF token
- ✓ **Rate Limit**: 1000 req/hr auth, 100 req/hr anon (per IP)

---

## Deployment Checklist

### Pre-Launch
- [ ] Database: PostgreSQL RDS Multi-AZ, automated backups
- [ ] Storage: S3 private bucket, lifecycle policy (delete after 90d)
- [ ] Cache: Redis (ElastiCache), single node sufficient
- [ ] Compute: ECS Fargate, 2 tasks (failover), auto-scale at 70% CPU
- [ ] DNS: Route 53 or external
- [ ] TLS: AWS Certificate Manager (auto-renew)
- [ ] Monitoring: Sentry (errors), CloudWatch (logs, metrics)

### CI/CD Pipeline
- [ ] GitHub Actions: PR workflow (typecheck, lint, test, build image)
- [ ] ECR: Push Docker image on merge to main
- [ ] ECS: Rolling deployment (1 task at a time)
- [ ] Health checks: Smoke test after deploy

### Post-Launch
- [ ] Monitor Sentry error rate (target: < 1% of requests)
- [ ] Monitor API latency (target: p95 < 500ms)
- [ ] Monitor uptime (target: 99% for MVP, 99.9% for v1.0)
- [ ] Review user feedback weekly

---

## Week-by-Week Roadmap

```
Week 1–2  │ Setup, Auth                    │ [######    ] 30%
Week 3    │ Rooms, Invites                 │ [##########] 60%
Week 4    │ File Upload/Storage            │ [##########] 80%
Week 5    │ Frontend Setup, Routing        │ [##########] 85%
Week 6    │ Frontend Auth, Dashboard       │ [##########] 90%
Week 7    │ Frontend Room View, Upload     │ [##########] 95%
Week 8    │ Frontend Settings, Polish      │ [##########] 98%
Week 9    │ Mobile Responsive, Bug Fixes   │ [##########] 99%
Week 10   │ Testing, Deploy, Launch        │ [##########] 100%
```

---

## Transition to v1.0 (Features Deferred)

| Feature | MVP | v1.0 | Effort |
|---------|-----|------|--------|
| Real-time (Socket.io) | ✗ | ✓ | 3 weeks |
| Comments & Threading | ✗ | ✓ | 2 weeks |
| Version History | ✗ | ✓ | 2 weeks |
| Full-text Search (ES) | ✗ | ✓ | 2 weeks |
| Tagging & Folders | ✗ | ✓ | 1 week |
| OAuth (Google/GitHub) | ✗ | ✓ | 1 week |
| Desktop App (Electron) | ✗ | ✓ | 3 weeks |
| Mobile App (React Native) | ✗ | ✓ | 4 weeks |
| Notifications | ✗ | ✓ | 2 weeks |
| Activity Feed | ✗ | ✓ | 1 week |

---

## Environment Variables (Backend)

```env
# Auth
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
JWT_PUBLIC_KEY=-----BEGIN RSA PUBLIC KEY-----\n...
REFRESH_TOKEN_SECRET=very-secret-string-min-32-chars

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nexus

# Redis
REDIS_URL=redis://localhost:6379

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=nexus-uploads
S3_UPLOADS_PREFIX=rooms/

# Email (SES)
AWS_SES_REGION=us-east-1
SENDER_EMAIL=noreply@nexus.app

# App
APP_URL=https://nexus.app
BCRYPT_COST=12
SESSION_MAX_AGE=2592000000  // 30 days in ms

# Monitoring
SENTRY_DSN=https://...@sentry.io/123456
```

---

## Environment Variables (Frontend)

```env
VITE_API_URL=https://api.nexus.app
VITE_APP_URL=https://nexus.app
VITE_SENTRY_DSN=https://...@sentry.io/123456
```

---

## Common Tasks

### Task: Deploy a New Version
```bash
# 1. Merge PR to main
# 2. GitHub Actions runs:
#    - npm ci && npm run type-check
#    - npm run lint
#    - npm run test
#    - docker build -t nexus:sha...
#    - push to ECR
# 3. ECS detects new image, rolls out (1 task at a time)
# 4. Run Prisma migrations (in entrypoint script)
# 5. Smoke tests pass
# 6. Done!
```

### Task: Add a New File Type (e.g., DOCX for v1.0)
```typescript
// 1. Update Prisma schema: type enum
// 2. Update validation: contentTypes = ['pdf', 'image', 'docx']
// 3. Update file preview component (add Word viewer library)
// 4. Update tests
// 5. Deploy
```

### Task: Implement Comments (v1.0)
```typescript
// 1. Create comments table in Prisma
// 2. Add GET/POST /content/:id/comments endpoints
// 3. Create notification rows on comment
// 4. Add comments UI (sidebar in preview modal)
// 5. Wire WebSocket event: COMMENT_ADDED (v1.0 feature)
```

---

## Testing Strategy (MVP)

| Category | Coverage | Tool | Examples |
|----------|----------|------|----------|
| **Unit** | Auth, RBAC, crypto | Jest | Password hash, JWT sign/verify, HMAC |
| **Integration** | API routes + DB | Jest + TestContainers | Signup → login, upload → list |
| **E2E** | Critical flows | Playwright | Login, create room, upload, invite, join |
| **Security** | RBAC, XSS, CSRF | Manual + automated | Viewer cannot delete, no injection |

**Target:** 70% coverage on auth, rooms, files modules.

---

## Known Gotchas & Tips

1. **JWT Expiry Logic**: Always handle 401 in client → trigger refresh via refresh endpoint, retry original request
2. **Presigned URL Timing**: Generate only 1 hour before upload; don't cache them across sessions
3. **S3 CORS**: Enable for POSTing directly from browser; restrict to your domain
4. **RLS Performance**: Add indexes on (room_id, user_id); test with 1000+ users
5. **Password Reset**: Hash tokens even before storing; use HMAC to prevent DB enumeration
6. **Invite Single-Use**: Mark used_at immediately; set RLS to prevent reuse
7. **File Deletion**: Use soft-delete (is_deleted flag) initially; hard-delete in background job later
8. **Mobile Viewports**: Test on 375px width; ensure touch targets are 48px min height
9. **Error Messages**: Don't leak whether email exists (return same "check inbox" for both signup + forgot-password)
10. **Rate Limiting**: Use Redis INCR with TTL; key pattern: `rate:action:userId:time_window`

---

**Last Updated:** May 2026 | **Version:** 1.0-MVP | **Audience:** Developers, Architects

