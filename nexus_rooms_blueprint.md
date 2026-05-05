**NEXUS ROOMS — Product Blueprint**   |   Confidential




**NEXUS ROOMS**

Private Room-Based Document & Content Sharing Platform

─────────────────────────────────────────────

**COMPLETE PRODUCT BLUEPRINT**

PRD  ·  Architecture  ·  Security  ·  UI/UX  ·  Tech Stack


Confidential — Senior Product Architecture Document

Version 1.0  ·  May 2026


# **1. PRODUCT REQUIREMENTS DOCUMENT (PRD)**
## **1.1 Problem Statement**
Modern teams suffer from fragmented content sharing. Files are scattered across email attachments, cloud drives, Slack threads, and Notion pages — each siloed, poorly organized, and uncontrolled. There is no lightweight, private-by-default space where a team or group can drop diverse content types (documents, images, links, rich text) into a single structured room and immediately collaborate, version, and classify it.

Nexus Rooms solves this by introducing the concept of a private, invite-only room — a focused micro-workspace where everything shared is organized, searchable, versioned, and live-synced for all participants.
## **1.2 Target Users**

|**User Segment**|**Description**|**Key Pain Point**|
| :- | :- | :- |
|Remote Teams|5–50 person distributed squads|Content scattered across 4–6 tools|
|Freelancers / Agencies|Share deliverables with clients securely|No branded, private client portal|
|Researchers & Academics|Collaborate on papers, datasets, notes|Version control for non-code content|
|Project Managers|Centralize all project artifacts|Approval workflows and visibility|
|Creators & Communities|Share resources in private groups|Controlled access without full Google Workspace|

## **1.3 User Personas**
### **Persona A — Alex, the Startup PM (Primary)**
- Age: 31  |  Role: Product Manager at a 20-person SaaS startup
- Manages design reviews, spec docs, competitor research across Figma, Notion, Google Drive, and Slack
- Goal: One room per sprint where the team drops and reviews everything without switching context
- Frustration: Cannot control who sees what — everything in Google Drive is too open
### **Persona B — Priya, the Freelance Designer (Secondary)**
- Age: 27  |  Role: Independent UI/UX designer, 8 active clients
- Delivers PSD, PDF mockups, brand kits, and revision notes
- Goal: Per-client private room with invite link, no client needing to create an account
- Frustration: Email attachments lose version history; Dropbox is too expensive
### **Persona C — David, the Engineering Lead (Tertiary)**
- Age: 36  |  Role: Tech Lead overseeing architecture docs, RFCs, and runbooks
- Needs markdown-based rich text, PDF previews, and file versioning
- Goal: Version-controlled knowledge base per project, accessible via mobile
- Frustration: Confluence is too heavy; GitHub Wikis lack file handling
## **1.4 Use Cases**
### **UC-01: Create and Share a Project Room**
- Actor: Admin user
- Flow: Create room → set optional password → invite team via link → collaborate
- Success: All invited members can view/upload content within 2 minutes
### **UC-02: Upload and Classify a Document**
- Actor: Editor
- Flow: Drag-drop PDF → assign to folder → add tags (e.g., 'Q4', 'Design') → save
- Success: Document is searchable by tag, folder, and filename within 5 seconds
### **UC-03: Real-time Collaboration**
- Actor: Multiple users (Admin + Editors)
- Flow: User A uploads → User B sees new card instantly → User B comments
- Success: Zero-refresh, sub-500ms update propagation
### **UC-04: Guest Access via Invite Link**
- Actor: Unauthenticated guest (Viewer role)
- Flow: Click invite link → optional password entry → view-only room access
- Success: No mandatory account signup for viewer access
### **UC-05: Version History Rollback**
- Actor: Admin/Editor
- Flow: Open file → click 'Version History' → preview v2 → restore to v2
- Success: File restored without data loss in under 10 seconds
## **1.5 Functional Requirements**
### **Room System**
- FR-01: Create rooms with unique 8-char alphanumeric ID + human-readable slug
- FR-02: Join rooms via room ID or invite link (with expiry support)
- FR-03: Password-protect rooms with bcrypt hashing
- FR-04: RBAC — Admin, Editor, Viewer roles per room
- FR-05: Delete rooms (admin-only) with cascade delete of all content
- FR-06: Room metadata: name, description, cover image, creation date, member count
### **Content Management**
- FR-07: Upload documents (PDF, DOCX, PPTX, XLSX) up to 100 MB per file
- FR-08: Upload images (PNG, JPG, GIF, WebP, SVG)
- FR-09: Add URL links with auto-fetched OG metadata (title, description, thumbnail)
- FR-10: Create rich text / markdown blocks with full formatting
- FR-11: Full CRUD on all content items
- FR-12: Drag-and-drop upload with progress bar
### **Classification & Search**
- FR-13: Create nested folders/sections inside rooms
- FR-14: Multi-tag assignment per content item
- FR-15: Full-text search across file names, tags, text content, and link titles
- FR-16: Filter by type (doc/image/link/text), tag, date, uploader
### **Collaboration**
- FR-17: Inline threaded comments on any content item
- FR-18: Version history for files and rich text (min. 20 versions)
- FR-19: Real-time cursors / presence indicators showing active users
- FR-20: Activity log showing all room events (uploads, edits, comments)
- FR-21: In-app notifications for comments, mentions (@username), new uploads
## **1.6 Non-Functional Requirements**

|**Category**|**Metric**|**Requirement**|
| :- | :- | :- |
|Performance|API Response|p95 < 200ms for read endpoints|
|Performance|File Upload|100 MB upload in < 30s on 10 Mbps|
|Scalability|Concurrent Users|10,000 concurrent users per room cluster|
|Availability|Uptime|99\.9% SLA (< 8.7 hrs downtime/year)|
|Security|Encryption|AES-256 at rest, TLS 1.3 in transit|
|Offline|Offline reads|Last 50 content items cached locally|
|Accessibility|WCAG|WCAG 2.1 AA compliance|
|Mobile|Bundle size|< 3 MB initial JS bundle|

## **1.7 Success Metrics**
- Activation Rate: 60% of new users create or join a room within first session
- DAU/MAU Ratio: ≥ 0.35 (healthy daily engagement)
- Content Upload Rate: ≥ 3 items uploaded per active room per week
- Retention: 40% of rooms active after 30 days
- NPS: ≥ 45 (Promoter-heavy)
- Time-to-Share: Median < 90 seconds from signup to first content upload


# **2. APP FLOW — DETAILED USER JOURNEYS**
## **2.1 Onboarding Flow**
### **First-Time User (Auth Flow)**
1. User opens app → Landing screen with 'Sign Up' / 'Log In' / 'Join Room as Guest'
1. Sign Up: Enter email + password → Receive verification email → Click link → Account active
1. OAuth path: Click 'Continue with Google/GitHub' → Consent screen → Auto-provisioned account
1. Post-signup: Prompted to 'Create your first room' or 'Join via Room ID' → Dashboard
### **Guest Access Flow**
1. User receives invite link (e.g., nexus.app/join/ABC12XYZ?token=...)
1. Click link → If password-protected: password modal shown → Enter password
1. If valid: User enters room as Viewer — no account required
1. Optional banner: 'Create an account to save access and comment'
## **2.2 Room Creation Flow**
1. From Dashboard: Click 'New Room' button (top-right CTA)
1. Room Setup Modal opens with form: Room Name (required), Description (optional), Cover Color/Emoji
1. Privacy settings: Public Room ID / Password Protected / Invite-only
1. Role defaults: Creator becomes Admin automatically
1. Submit → Room created → User lands on empty Room View
1. Invite panel appears: Copy Room ID, Copy Invite Link, Set Expiry (24h/7d/30d/never)
1. User can immediately start uploading content
## **2.3 Content Upload & Classification Flow**
1. Inside Room View: Click 'Add Content' button or drag-drop files onto the room canvas
1. Upload modal opens with tabbed options: File Upload | Link | Rich Text | Image
1. File Upload path:
- Drag file or click Browse → File validated (type + size check)
- Progress bar shows upload % → On complete, thumbnail/icon generated
- Assign to Folder (dropdown with + create new) → Add Tags (autocomplete multi-select)
- Optional: Add description → Save
1. Link path: Paste URL → Auto-fetch OG metadata (title, image, description) → Edit if needed → Save
1. Rich Text path: Markdown editor opens → Write/paste content → Formatting toolbar → Save
1. Content card appears in room immediately (real-time broadcast to all active users)
## **2.4 Daily Use Flow**
1. User opens app → Sees Dashboard with 'Recent Rooms' and notification badge
1. Click room card → Room View loads with all content sections
1. Filter/search bar: Type to instantly filter visible content
1. Click any content card → Preview panel opens (PDF viewer, image viewer, link preview, text)
1. Comment: Click comment icon on card → Thread sidebar opens → Type + submit
1. Notifications bell: Shows unread — click to jump to that content/comment
## **2.5 Flow Diagrams (Text-Based)**
### **Authentication Flow**
[ App Open ]

`     `|

`     `├── [ Has valid JWT? ] ──YES──> [ Dashboard ]

`     `|

`     `NO

`     `|

`     `├── [ Sign Up ] ──> [ Email Verification ] ──> [ Account Active ] ──> [ Dashboard ]

`     `├── [ Log In  ] ──> [ Validate Credentials ] ──> [ Issue JWT + Refresh ] ──> [ Dashboard ]

`     `├── [ OAuth   ] ──> [ Provider Consent ] ──> [ Upsert User ] ──> [ Issue JWT ] ──> [ Dashboard ]

`     `└── [ Guest   ] ──> [ Invite Link Parse ] ──> [ Room Access (Viewer) ]
### **Room Join Flow**
[ Enter Room ID or click Invite Link ]

`     `|

`     `├── [ Room exists? ] ──NO──> [ Error: Room not found (404 screen) ]

`     `|

`     `YES

`     `|

`     `├── [ Password protected? ] ──YES──> [ Password Modal ] ──> [ Validate ] ──> [ Grant Access ]

`     `|                                                              └── [ Wrong ] ──> [ Retry (3 max) ]

`     `NO

`     `|

`     `├── [ Invite link expired? ] ──YES──> [ Error: Link expired screen + 'Request new link' ]

`     `|

`     `└── [ Load Room View ]
### **File Upload Flow**
[ User drops file / clicks Upload ]

`     `|

`     `├── [ Validate: type allowed? ] ──NO──> [ Error: Unsupported format toast ]

`     `|

`     `├── [ Validate: size ≤ 100MB? ] ──NO──> [ Error: File too large toast ]

`     `|

`     `YES

`     `|

`     `├── [ Upload to S3 via presigned URL ] ──> [ Progress bar UI ]

`     `|

`     `├── [ On success: POST /api/content with S3 key ]

`     `|

`     `├── [ Server: generate thumbnail, extract metadata ]

`     `|

`     `└── [ WebSocket broadcast to room: NEW\_CONTENT event ] ──> [ All users see card ]
## **2.6 Edge Cases**
- Invalid Room ID: HTTP 404 → 'Room not found' screen with 'Create New Room' CTA
- Permission Denied: User tries to upload as Viewer → Toast error 'You have view-only access'
- Invite Link Expired: Clear expiry screen with timestamp and option to request a new link from admin
- File Too Large: Validated client-side (< 100 MB) with clear feedback before network call
- Concurrent Edit Conflict: Server uses optimistic concurrency (version tokens) → Conflict modal with diff view
- Network Drop During Upload: Resumable upload with TUS protocol — resume button on reconnect
- Room Deletion Race Condition: Remaining active users get 'Room has been deleted' modal and redirect
- Session Expiry: Refresh token auto-renews JWT silently; if refresh fails, redirect to login with return URL
- Duplicate File Upload: Hash-based deduplication — user warned 'This file was already uploaded (v1)'; option to create new version


# **3. SECURITY SYSTEM DESIGN**
## **3.1 Authentication**
### **JWT-Based Auth with Refresh Token Rotation**
- Access Token: Short-lived JWT (15 min expiry), signed with RS256 (asymmetric)
- Refresh Token: Long-lived opaque token (30 days), stored in HttpOnly cookie (not localStorage)
- Rotation: Each refresh issues a new refresh token and invalidates the previous one
- Blacklisting: Revoked tokens stored in Redis with TTL matching token expiry
### **OAuth 2.0 Integration**
- Supported providers: Google, GitHub (extensible to Microsoft, Apple)
- PKCE flow enforced for all OAuth exchanges
- State parameter with CSRF nonce validated on callback
- Scope: profile + email only — no unnecessary permissions
### **Email/Password**
- Passwords hashed with bcrypt (cost factor 12)
- Email verification required before room creation
- Password reset via time-limited token (1 hour), single-use, HMAC-signed
## **3.2 Authorization (RBAC)**

|**Permission**|**Admin**|**Editor**|**Viewer**|
| :- | :- | :- | :- |
|Create / Delete Room|✓|✗|✗|
|Manage Members & Roles|✓|✗|✗|
|Upload / Edit / Delete Content|✓|✓|✗|
|Create Folders & Tags|✓|✓|✗|
|Comment on Content|✓|✓|✓|
|View Content|✓|✓|✓|
|Generate Invite Links|✓|✓ (Editor invite only)|✗|
|Manage Room Settings|✓|✗|✗|

RBAC is enforced at the API layer on every endpoint via middleware. Row-level security (RLS) in PostgreSQL provides a second layer of defense ensuring users can only query data belonging to rooms they are members of.
## **3.3 Room Access Control**
### **Room ID Access**
- Room IDs are 8-character base62 strings — 218 trillion combinations, brute-force infeasible
- 3 failed access attempts trigger a 60-second lockout per IP + per room combination
- Rate limiting: max 10 room-join attempts per IP per minute
### **Invite Links**
- Format: /join/{roomId}?token={HMAC-signed-payload}
- Payload encodes: roomId, role, expiry timestamp, and a random nonce
- Signed with HMAC-SHA256 using a server secret — tampering detection built in
- Configurable expiry: 24 hours, 7 days, 30 days, or never
- Single-use option: token invalidated after first successful use
- Admin can revoke all active invite tokens for a room instantly
## **3.4 File Security**
- Files stored in private S3 bucket — no public ACLs
- Access via pre-signed S3 URLs with 15-minute expiry, generated on-demand per authenticated request
- Server validates room membership + content ownership before issuing signed URL
- File uploads go through a server-side virus scan (ClamAV or AWS Macie) before being marked as available
- File type verified by magic bytes on the server (not just extension) to prevent MIME confusion attacks
- CDN (CloudFront) layer for read performance with signed cookies for authenticated delivery
## **3.5 Data Encryption**
- At Rest: AES-256 encryption for database (RDS encrypted volumes) and S3 (SSE-S3 or SSE-KMS)
- In Transit: TLS 1.3 enforced for all HTTPS connections; HTTP → HTTPS redirect at load balancer
- Sensitive fields (room passwords) stored as bcrypt hashes, never reversibly encrypted
- Encryption keys managed via AWS KMS with automatic rotation every 90 days
- WebSocket connections secured via wss:// (TLS) only
## **3.6 Attack Protection**

|**Attack Vector**|**Mitigation**|
| :- | :- |
|XSS|Strict CSP header; all user content sanitized with DOMPurify; React JSX auto-escapes interpolations|
|CSRF|SameSite=Strict cookie attribute; CSRF double-submit token on state-changing requests|
|SQL Injection|Parameterized queries only via Prisma ORM; no raw SQL with user inputs|
|Brute Force|Exponential backoff + account lockout after 5 failures; IP-based rate limiting via Redis|
|File Upload Abuse|File type whitelist; max size enforced server-side; virus scan; filename sanitization|
|SSRF (Link Preview)|Link previews fetched in isolated Lambda; allow-list of resolvable IP ranges; no private IPs|
|Data Exfiltration|Signed URLs expire in 15 min; audit log for all downloads; anomaly alerts for bulk downloads|

## **3.7 Rate Limiting & Abuse Prevention**
- Global API: 1,000 requests/hour per authenticated user; 100/hour for unauthenticated
- Upload endpoint: 50 uploads/hour per user to prevent storage abuse
- WebSocket: max 200 messages/min per connection; auto-disconnect on excess
- Comment spam: 30 comments/hour per user per room
- Invite generation: 20 links/hour per room
- All limits enforced via Redis sliding window counters; violations return 429 with Retry-After header


# **4. SYSTEM ARCHITECTURE**
## **4.1 High-Level Architecture**
Nexus Rooms follows a microservices-ready monolith (modular monolith) pattern for v1, designed to be decomposed into independent services as load demands. This minimizes operational complexity at launch while preserving scalability.
### **Architecture Overview (Text Diagram)**
┌───────────────────────────────────────────────────────────────────┐

│                         CLIENT TIER                               │

│  React (Web)  ·  React Native (iOS/Android)  ·  Electron (Desktop)│

└─────────────────────┬─────────────────────────────────────────────┘

`                      `│  HTTPS / WSS

┌─────────────────────▼─────────────────────────────────────────────┐

│                    EDGE / GATEWAY TIER                            │

│  AWS CloudFront CDN  ·  WAF (Web Application Firewall)            │

│  Application Load Balancer  ·  AWS API Gateway (WebSocket)        │

└──────────┬──────────────────────────────────┬──────────────────────┘

`           `│ REST / GraphQL                    │ WebSocket

┌──────────▼──────────────┐      ┌────────────▼──────────────────────┐

│    API SERVER (Node.js) │      │   REALTIME SERVER (Socket.io)     │

│  Auth  ·  Rooms  ·  Content│   │   Room channels  ·  Presence      │

│  Files  ·  Search  ·  Notify│  │   Notifications  ·  Activity      │

└──────────┬──────────────┘      └────────────┬──────────────────────┘

`           `│                                   │

┌──────────▼───────────────────────────────────▼──────────────────────┐

│                         DATA TIER                                    │

│  PostgreSQL (RDS)  ·  Redis (ElastiCache)  ·  Elasticsearch          │

│  S3 (Files/Images)  ·  SQS (Async Jobs)                             │

└──────────────────────────────────────────────────────────────────────┘

`           `│

┌──────────▼────────────────────────────────────────────────────────┐

│                    WORKER TIER (Background)                       │

│  Thumbnail Gen  ·  Virus Scan  ·  Link Metadata  ·  Email Sender  │

│  Version Snapshot  ·  Search Indexer  ·  Cleanup Jobs             │

└───────────────────────────────────────────────────────────────────┘
## **4.2 Frontend Architecture**
### **Structure**
- Monorepo (Turborepo): apps/web, apps/mobile, apps/desktop share packages/ui, packages/api-client, packages/types
- State Management: Zustand for global store (auth, current room, notifications); React Query (TanStack) for server state with optimistic updates
- Routing: React Router v6 (web), React Navigation (mobile)
- Real-time: Custom WebSocket hook subscribes to room channel; updates React Query cache directly
### **Key Modules**
- auth/ — Login, signup, OAuth callback, token refresh
- rooms/ — Dashboard, room creation, room detail view
- content/ — Content cards, upload modal, preview panel
- editor/ — Rich text editor (Tiptap/ProseMirror based)
- comments/ — Thread component, notification integration
- search/ — Debounced search bar, filter chips, result list
- settings/ — Room settings, member management, role assignment
## **4.3 Backend Architecture**
### **API Design: REST with WebSocket for Real-time**
- RESTful JSON API for all CRUD operations — familiar, cacheable, tooling-friendly
- WebSocket (Socket.io over AWS API Gateway) for real-time events
- API versioned under /api/v1/ — breaking changes get new version
### **Core API Modules**

|**Module**|**Key Endpoints**|**Responsibilities**|
| :- | :- | :- |
|Auth|POST /auth/signup, /login, /refresh, /oauth|JWT issuance, OAuth, password reset, email verification|
|Rooms|GET/POST/PUT/DELETE /rooms, /rooms/:id/members|Room CRUD, membership management, invites|
|Content|GET/POST/PUT/DELETE /rooms/:id/content|File/link/text CRUD, folder management, tagging|
|Files|POST /files/presign, GET /files/:id/url|S3 presigned URLs, virus scan status, version management|
|Comments|GET/POST/PUT/DELETE /content/:id/comments|Threaded comments, notifications trigger|
|Search|GET /rooms/:id/search?q=&filters=|Elasticsearch query, filter parsing, highlight|
|Activity|GET /rooms/:id/activity|Room event log, pagination, filtering|
|Notifications|GET /notifications, POST /notifications/read|User inbox, bulk mark-read, WebSocket push|

## **4.4 Database Design**
### **Core Tables (PostgreSQL)**
**users**

- id (UUID PK), email (unique), password\_hash, display\_name, avatar\_url
- provider (enum: local/google/github), provider\_id, email\_verified
- created\_at, updated\_at, last\_login\_at

**rooms**

- id (UUID PK), slug (unique), name, description, cover\_color
- password\_hash (nullable), is\_deleted, created\_by (FK users)
- created\_at, updated\_at

**room\_members**

- id, room\_id (FK), user\_id (FK), role (enum: admin/editor/viewer)
- joined\_at, invited\_by (FK users)
- UNIQUE(room\_id, user\_id)

**invite\_links**

- id, room\_id (FK), token (unique, HMAC-signed), role, created\_by
- expires\_at (nullable), is\_single\_use, used\_at (nullable), is\_revoked

**folders**

- id, room\_id (FK), parent\_id (self-referencing FK, nullable), name
- created\_by, created\_at, position (integer for ordering)

**content\_items**

- id (UUID PK), room\_id (FK), folder\_id (FK nullable), created\_by (FK)
- type (enum: document/image/link/text), title, description
- storage\_key (S3 key, nullable), url (nullable for links)
- metadata (JSONB — OG data for links, file size/mime for docs)
- version (integer), is\_deleted, position
- created\_at, updated\_at

**content\_versions**

- id, content\_item\_id (FK), version\_number, storage\_key, snapshot (JSONB for text)
- created\_by, created\_at, change\_summary

**tags**

- id, room\_id (FK), name (unique per room), color

**content\_tags**

- content\_item\_id (FK), tag\_id (FK) — junction table

**comments**

- id, content\_item\_id (FK), parent\_id (self-ref FK, for threads), author\_id (FK)
- body (text), is\_edited, is\_deleted, created\_at, updated\_at

**notifications**

- id, user\_id (FK), type (enum: comment/mention/upload/etc.), payload (JSONB)
- is\_read, created\_at, room\_id (FK), content\_item\_id (FK nullable)

**activity\_log**

- id, room\_id (FK), actor\_id (FK), action (enum), target\_type, target\_id
- metadata (JSONB), created\_at
### **Indexes & Relations**
- Composite index on (room\_id, type, is\_deleted) for content\_items — primary query pattern
- GIN index on content\_items.metadata JSONB for metadata search
- B-tree index on activity\_log.room\_id + created\_at for log pagination
- Foreign key cascade deletes: room deletion cascades to all room-scoped data
## **4.5 File Storage Strategy**
- Primary Storage: AWS S3 (us-east-1 primary, us-west-2 replication for DR)
- Bucket structure: nexus-uploads/{env}/{room\_id}/{content\_id}/{version}/{filename}
- Upload flow: Client requests presigned PUT URL → uploads directly to S3 → sends completion event to API → API records metadata and triggers worker
- Worker pipeline: S3 trigger → SQS queue → Lambda processes (virus scan, thumbnail gen, text extraction for search indexing)
- CDN: CloudFront distribution in front of S3 for read performance — signed cookies for authenticated delivery
- Thumbnails: Stored in nexus-thumbnails/ bucket, 200×200 and 800×600 variants
- Lifecycle policy: Deleted content moves to Glacier after 30-day soft-delete, purged after 90 days
## **4.6 Real-time System**
- Technology: Socket.io over AWS API Gateway (WebSocket API)
- Rooms as channels: Each room has a dedicated socket channel room:{roomId}
- Horizontal scaling: Socket.io with Redis adapter (pub/sub) — any API server instance can broadcast to any room
- Events broadcasted: CONTENT\_ADDED, CONTENT\_UPDATED, CONTENT\_DELETED, COMMENT\_ADDED, MEMBER\_JOINED, MEMBER\_LEFT, ACTIVITY\_LOGGED, NOTIFICATION\_PUSHED
- Presence: Users publish heartbeat every 30s; server tracks presence in Redis with 60s TTL
- Reconnection: Exponential backoff; client rehydrates missed events via /rooms/:id/events?since= REST endpoint
## **4.7 Scalability Design**
- Stateless API: No session state on servers — all state in PostgreSQL/Redis — horizontal scaling trivial
- Database: RDS PostgreSQL with read replicas (route read queries via PgBouncer connection pool)
- Caching: Redis caches room membership, user profiles, search results (5-min TTL) — 80%+ read cache hit target
- Background jobs: SQS-backed workers auto-scale independently of API servers
- CDN offloads: File delivery via CloudFront — no API server bandwidth cost for file reads
- Search: Elasticsearch cluster (3-node) handles search queries independently
- Future: Service decomposition plan — Auth, Rooms, Content, Realtime as separate services behind API gateway


# **5. UI/UX DESIGN**
## **5.1 Design Principles**
- Minimal Cognitive Load: Every screen has one primary action. No feature jungles.
- Content-First: UI chrome is secondary — content cards are the hero elements
- Progressive Disclosure: Advanced options (version history, RBAC) are accessible but not prominent
- Responsive by Default: Components designed for 360px → 1440px with no separate codebases
- Feedback-Rich: Every action (upload, comment, delete) has immediate visual confirmation
- Accessible: WCAG 2.1 AA — keyboard navigation, screen reader support, sufficient contrast ratios
## **5.2 Information Architecture**
Level 1 — App: Auth → Dashboard

Level 2 — Dashboard: My Rooms | Recent | Notifications | Settings

Level 3 — Room: Sections/Folders | Search bar | Member count | Activity log icon

Level 4 — Content: Content Card → Preview Panel (with Comments | Versions | Info tabs)

Navigation Model: Persistent left sidebar (desktop) / Bottom tab bar (mobile)

Modal Stack: Upload modal → Folder picker → Tag selector (layered, dismissible)
## **5.3 Key Screen Descriptions**
### **Screen 1: Login / Signup**
- Layout: Centered card (480px wide) on full-bleed gradient background (deep navy to teal)
- Elements: App logo + wordmark, tab switcher (Log In | Sign Up), email/password fields, OAuth buttons (Google, GitHub) with divider
- Log In fields: Email, Password, 'Forgot password' link, primary CTA 'Log In'
- Sign Up fields: Display Name, Email, Password (with strength meter), CTA 'Create Account'
- Guest path: Small 'Join a room without account' link below card
- Mobile: Full-screen, keyboard-aware scroll, large touch targets (48px min height)
### **Screen 2: Dashboard**
- Layout: Left sidebar (240px, collapsible) + main content area
- Sidebar: User avatar + name, 'New Room' primary button, 'My Rooms' list (icon + name + unread badge), 'Settings' link
- Main: Welcome header with user name, 'Recent Rooms' grid (2–4 columns responsive card grid)
- Room Card: Cover color/emoji, name, last activity timestamp, member avatars (up to 5), content count
- Top bar: Global search input (searches across all rooms), notification bell with badge, user menu
- Empty state: Illustration + 'Create your first room' and 'Join a room' CTAs
- Mobile: Bottom nav (Dashboard | Rooms | Notifications | Profile), rooms displayed as full-width cards
### **Screen 3: Room View**
- Layout: Sticky top bar (room name + settings icon + member presence avatars) + sidebar (folders/sections) + main content grid
- Sidebar: 'All Content' (default), folder tree with expand/collapse, Tags list with count badges
- Content Grid: Masonry-style card grid or list view toggle
- Content Card (Document): File type icon, filename, uploader avatar + name, upload date, comment count badge, tag chips
- Content Card (Image): Thumbnail preview, filename, overlay on hover (expand / comment / download)
- Content Card (Link): Favicon + OG image, title, domain, description excerpt
- Content Card (Text): Formatted preview excerpt (2–3 lines), author, date
- Top bar actions: 'Add Content' button (opens upload modal), Search/filter row, View toggle (grid/list), Sort dropdown
- Activity Log: Slide-in right panel showing chronological event stream for the room
- Mobile: Single-column card list, bottom floating 'Add' FAB, swipe-to-filter sidebar
### **Screen 4: Upload / Share Modal**
- Trigger: 'Add Content' button or drag-drop on room canvas
- Modal: 540px wide, 4 tabs at top — Document | Image | Link | Text
- Document tab: Drop zone with dashed border + browse button, file type list, size limit note, progress bar
- Image tab: Same drop zone, image preview thumbnail appears after selection
- Link tab: URL input field with 'Fetch Preview' button, editable preview card (title, description, thumbnail)
- Text tab: Full Tiptap rich text editor with toolbar (Bold, Italic, Code, Lists, Headings, Link)
- Common bottom section (all tabs): Folder dropdown, Tag multi-select with search, Description textarea, 'Save' + 'Cancel' buttons
- Mobile: Full-screen bottom sheet instead of modal; same content, touch-optimized inputs
### **Screen 5: Content Viewer / Preview Panel**
- Trigger: Click any content card
- Layout: Right-side panel (40% width on desktop) slides in; main content dims but stays visible
- PDF Viewer: Embedded PDF.js renderer with page navigation, zoom, download button
- Image Viewer: Full-resolution image, zoom/pan, download button
- Link Preview: Rendered OG card, 'Open in new tab' button, full metadata
- Text View: Rendered markdown/rich text, 'Edit' button (for editors/admins)
- Panel Tabs: Preview | Comments | Versions | Info
- Comments tab: Thread list with reply counts, compose input at bottom with @mention support
- Versions tab: Timeline list (v1, v2… vN) with timestamp + author + change note; 'Restore' button per version
- Info tab: File size, type, upload date, uploader, folder, tags, download count
- Mobile: Full-screen viewer with bottom sheet for comments/info
## **5.4 Navigation Structure**
Desktop:

- Persistent left sidebar: Rooms list, navigation
- Top bar: Search, notifications, user menu
- Right panel: Content preview/comments (contextual)

Mobile (Bottom Tab Bar):

- Tab 1: Home/Dashboard
- Tab 2: Rooms list
- Tab 3: Search
- Tab 4: Notifications
- Tab 5: Profile/Settings
## **5.5 Mobile vs Desktop UX Differences**

|**Feature**|**Desktop**|**Mobile**|
| :- | :- | :- |
|Navigation|Fixed left sidebar|Bottom tab bar + hamburger|
|Content Grid|2–4 column masonry|Single column cards|
|Upload|Drag-drop modal|FAB → camera/file picker/share sheet|
|Content Preview|Side panel (40% width)|Full-screen modal|
|Comments|Panel tab|Bottom sheet|
|Room Sidebar|Persistent|Swipe-in drawer|
|Rich Text Editor|Full toolbar|Floating mini toolbar|


# **6. RECOMMENDED PRODUCTION TECH STACK**
Every recommendation below is justified specifically for this application's requirements: real-time collaboration, file-heavy operations, multi-platform delivery, and RBAC access control.
## **6.1 Frontend**
### **Framework: React 18 + TypeScript**
- WHY: React's ecosystem is unmatched for building a complex, interactive UI. React 18 Concurrent features (Suspense, useTransition) enable smooth file previews and real-time updates without janky re-renders. TypeScript eliminates entire classes of runtime bugs in a codebase this complex.
- Alternative considered: Vue 3 — rejected because the React ecosystem has better tooling for file handling (React-PDF, React-Dropzone) and more mature real-time state integration patterns.
### **State Management: Zustand + TanStack Query (React Query)**
- Zustand: Lightweight atom-based store for UI state (auth session, open panels, presence data). Zero boilerplate vs Redux. Perfect for WebSocket-driven state mutations.
- TanStack Query: Server state management with automatic caching, background refetching, and optimistic updates. Eliminates loading/error boilerplate across 20+ API endpoints.
- WHY NOT Redux: Too much ceremony for this app size. Zustand + React Query covers all needs with 1/10th the boilerplate.
### **Styling: Tailwind CSS + shadcn/ui**
- Tailwind: Utility-first CSS enables consistent, design-token-backed styling with no CSS cascade issues. Critical for a cross-platform component library.
- shadcn/ui: Accessible, unstyled components (Radix UI primitives) styled via Tailwind — gives us production-ready Dialogs, Dropdowns, Tooltips, and Sheets with built-in ARIA compliance.
- Result: Design system that works identically on Web and Electron desktop without duplicating code.
### **Build Tool: Vite**
- Sub-second HMR (Hot Module Replacement) even with large codebases. Outperforms webpack by 10–100× in dev cold-start time. ESBuild-based production bundling generates optimal chunks.
### **Desktop: Electron + electron-vite**
- WHY Electron over Tauri: The rich-text editor (Tiptap), PDF.js, and drag-drop file handling all rely on browser APIs that Electron (Chromium) handles natively. Tauri's WebView inconsistencies on Windows create rendering bugs for complex editors.
- electron-vite: Provides Vite HMR inside Electron main + renderer processes — unified DX.
- Auto-update: electron-updater for OTA updates via S3-hosted release manifest.
### **Mobile: React Native + Expo**
- WHY React Native: Shared TypeScript types, shared API client, and shared business logic with the web app via packages/. 60–70% code reuse vs writing a separate native app.
- WHY Expo: Managed workflow accelerates mobile CI/CD. EAS Build handles code signing. Expo Router provides file-based routing consistent with web mental model.
- Key libs: expo-document-picker (uploads), expo-image (optimized image rendering), react-native-reanimated (smooth animations for drawer/sheet).
### **Monorepo: Turborepo**
- Shared packages: packages/ui (shared components), packages/api-client (typed API + WebSocket hooks), packages/types (shared TypeScript interfaces)
- Turborepo's remote caching cuts CI build time by 60–80% by caching unchanged packages.
## **6.2 Backend**
### **Runtime & Framework: Node.js 20 LTS + Fastify**
- WHY Node.js: Event-loop model is optimal for I/O-bound workloads (file upload callbacks, WebSocket management, S3 presign requests) — better than blocking frameworks (Django/Rails) for this traffic pattern.
- WHY Fastify over Express: 2–3× throughput vs Express in benchmarks. Built-in JSON schema validation (AJV) on routes — critical for API security. Plugin architecture is cleaner than Express middleware chains.
- TypeScript throughout: End-to-end type safety from DB schema to API response to frontend component.
### **ORM: Prisma**
- Type-safe database queries — zero raw SQL with user inputs (prevents injection). Auto-generated types sync with PostgreSQL schema. Migration system tracks schema changes in code.
- Prisma Accelerate (connection pooling) in production to handle connection spikes from horizontal scaling.
### **API Design: REST (Primary) + WebSocket (Real-time)**
- WHY REST over GraphQL: File upload mutations, streaming responses, and CDN cacheability are significantly simpler with REST. GraphQL's N+1 problem and complex subscriptions add overhead without proportional benefit for this app's data model.
- OpenAPI 3.0 spec auto-generated from Fastify schemas — drives SDK generation for the API client package.
### **Real-time: Socket.io with Redis Adapter**
- WHY Socket.io over raw WebSocket: Built-in room/namespace abstractions match our room model perfectly. Automatic reconnection, fallback transport (long-polling when WS blocked), and the Redis adapter enable horizontal scaling with zero code change.
- Deployed on AWS API Gateway WebSocket API in front of Socket.io servers for cost efficiency and managed WebSocket connection state.
## **6.3 Database**
### **Primary: PostgreSQL 16 (AWS RDS)**
- WHY PostgreSQL over MongoDB: Our data is highly relational (users → rooms → members → content → comments → versions). JSONB columns give MongoDB-like flexibility for metadata without sacrificing ACID guarantees and JOIN performance.
- Row-Level Security (RLS) policies enforce room membership at the database layer — second defense line beyond API auth.
- Deployment: RDS Multi-AZ for high availability, automated backups, read replicas for search/reporting queries.
### **Cache: Redis 7 (AWS ElastiCache)**
- Use cases: JWT blacklist, rate limit counters, presence heartbeats, room membership cache, search result cache, Socket.io pub/sub adapter.
- WHY Redis specifically: Atomic operations (INCR for rate limiting), TTL-native (perfect for token blacklisting), and pub/sub at microsecond latency for WebSocket broadcasting.
### **Search: Elasticsearch 8 (AWS OpenSearch)**
- WHY Elasticsearch: Full-text search with relevance ranking, field-level boosting (title > description > tags > body), and faceted filtering. PostgreSQL full-text search cannot scale to multi-room, multi-type queries with sub-100ms response.
- Index per document type (content\_items, rooms) with dynamic field mapping. Near real-time indexing via SQS consumer.
## **6.4 File Storage**
### **AWS S3 + CloudFront CDN**
- WHY S3: Industry-standard for file storage, 99.999999999% (11 nines) durability, native integration with Lambda (triggers), IAM policies, and KMS encryption. CDN integration is trivial.
- Upload strategy: Client → API (presign request) → API returns presigned PUT URL → Client uploads directly to S3 (bypassing API server — no bandwidth cost). API receives completion webhook or client notification.
- CloudFront: Global CDN with signed URLs for authenticated file delivery. Edge caching for thumbnails reduces S3 egress cost by 90%.
- Resumable uploads: TUS protocol via tus-js-client (frontend) + @tus/server (backend) for files > 5 MB.
## **6.5 Authentication Service**
### **Custom JWT + Lucia Auth (open-source)**
- WHY NOT Auth0/Clerk: For a file-sharing app with custom RBAC, the additional control over session management and role propagation in JWTs is worth building internally. Cost also becomes prohibitive at scale (Auth0 is expensive per MAU).
- Lucia Auth: Lightweight, framework-agnostic session library. Handles session storage, cookie management, and OAuth adapter integrations without opinionated user model.
- JWT payload includes: userId, email, sessionId (for revocation). Room-level roles fetched on-demand (not embedded in JWT to avoid stale role bugs).
- OAuth adapters: arctic library for Google + GitHub OAuth 2.0 PKCE flows.
## **6.6 DevOps & Infrastructure**
### **Cloud: AWS (Primary)**
- Compute: ECS Fargate (containerized, serverless compute) — auto-scales API and Worker services independently
- Database: RDS PostgreSQL Multi-AZ + ElastiCache Redis cluster
- Storage: S3 multi-region + CloudFront distribution
- Queues: SQS Standard queues for async worker jobs (thumbnail gen, virus scan, search indexing)
- Functions: Lambda for lightweight workers (OG metadata fetch, virus scan trigger) — event-driven, zero idle cost
- DNS + CDN: Route 53 + CloudFront
### **Containerization: Docker + Docker Compose**
- Each service (API, Worker, Realtime) has its own Dockerfile based on node:20-alpine
- docker-compose.yml for local development spins up: API, PostgreSQL, Redis, Elasticsearch, MinIO (local S3)
- Multi-stage Docker builds: build stage (full devDeps) → prod stage (runtime only). Images < 150 MB.
### **CI/CD: GitHub Actions**
- PR pipeline: TypeScript typecheck → ESLint → Jest unit tests → Playwright E2E (subset) → Docker build → Push to ECR
- Deploy pipeline: On merge to main → Push image → ECS rolling deployment → Prisma migration → Smoke tests
- Turborepo's affected detection: Only test/build packages changed in the PR — 60% faster CI.
### **Monitoring & Observability**
- APM: Datadog (traces, metrics, logs) with custom dashboards for WebSocket connections, upload throughput, and search latency
- Error Tracking: Sentry for both frontend (React) and backend (Node.js)
- Uptime: AWS Route 53 health checks + PagerDuty on-call alerting
- Logging: Structured JSON logs via Pino (Fastify's default) → CloudWatch → Datadog
## **6.7 Scalability Summary**

|**Bottleneck**|**Scaling Strategy**|
| :- | :- |
|API Servers|Stateless ECS tasks auto-scale on CPU/request count (target 60% CPU). Scale from 2 → 50 tasks in minutes.|
|Database Reads|RDS read replicas + Redis caching reduces primary DB load. PgBouncer connection pooling prevents connection exhaustion.|
|WebSocket Connections|Redis adapter enables multiple Socket.io instances. AWS API Gateway manages raw WS connections at cloud scale.|
|File Delivery|CloudFront CDN handles 95%+ of file reads without touching S3 or API servers.|
|Background Jobs|SQS queues decouple burst processing. Lambda workers auto-scale to queue depth.|
|Search|OpenSearch cluster scales horizontally by adding data nodes. Query routing via dedicated search service.|


# **APPENDIX: TECH STACK QUICK REFERENCE**

|**Layer**|**Technology**|**Key Justification**|
| :- | :- | :- |
|Web Frontend|React 18 + TypeScript + Vite|Ecosystem, real-time state, concurrent features|
|Mobile|React Native + Expo|Code sharing with web, EAS build/deploy|
|Desktop|Electron + electron-vite|Browser API compatibility for editors/PDF|
|State (Client)|Zustand + TanStack Query|UI state + server cache, minimal boilerplate|
|Styling|Tailwind CSS + shadcn/ui|Accessible components, design tokens|
|Backend Runtime|Node.js 20 + Fastify|I/O-optimized, schema validation, speed|
|ORM|Prisma|Type-safe queries, auto-migrations|
|Real-time|Socket.io + Redis Adapter|Room abstractions, horizontal scaling|
|Primary DB|PostgreSQL 16 (RDS)|Relational + JSONB, ACID, RLS|
|Cache|Redis 7 (ElastiCache)|Sessions, rate limits, pub/sub, presence|
|Search|Elasticsearch (OpenSearch)|Full-text, facets, sub-100ms at scale|
|File Storage|AWS S3 + CloudFront|Durability, direct upload, CDN delivery|
|Auth|Custom JWT + Lucia + arctic|Full control, OAuth, cost-efficient|
|Compute|AWS ECS Fargate|Containerized, auto-scale, serverless|
|CI/CD|GitHub Actions|Turborepo affected runs, ECR push, ECS deploy|
|Monitoring|Datadog + Sentry|APM, error tracking, structured logs|


**END OF BLUEPRINT DOCUMENT**

Nexus Rooms — Confidential Product Architecture  ·  Version 1.0  ·  May 2026
Version 1.0  ·  May 2026      / 
