# NEXUS ROOMS FOUNDATION - FILE MANIFEST

## Key Configuration Files

### Root Configuration
| File | Purpose |
|------|---------|
| `package.json` | Root workspace config, shared npm scripts |
| `turbo.json` | Turborepo pipeline definition, cache settings |
| `tsconfig.json` | Base TypeScript configuration with path aliases |
| `.eslintrc.json` | ESLint rules for all TypeScript files |
| `.prettierrc` | Code formatting rules |
| `.gitignore` | Git ignore patterns (excludes .env, node_modules, dist) |
| `docker-compose.yml` | PostgreSQL 16 + Redis 7 local development setup |

### Documentation
| File | Purpose |
|------|---------|
| `README.md` | Complete setup and development guide |
| `GETTING_STARTED.md` | Quick start (5-min guide) + detailed walkthrough |
| `NEXUS_ROOMS_MVP.md` | Full MVP specification (12 sections, 800+ lines) |
| `MVP_QUICK_REFERENCE.md` | Developer cheat sheet (tables, commands, examples) |
| `nexus_rooms_blueprint.md` | Full product blueprint (complete system design) |

---

## Backend Application (`apps/backend/`)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Backend dependencies (Fastify, Prisma, etc.) |
| `tsconfig.json` | Backend-specific TypeScript config |
| `.env.example` | Environment variables template |
| `.env` | Local environment (create from example) |

### Source Code
| File | Purpose |
|------|---------|
| `src/server.ts` | Main Fastify server entry point |

### Database
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | MVP database schema (7 tables) |
| `prisma/migrations/` | Database migration files (auto-generated) |

### Database Schema Tables
1. `users` - User accounts and profiles
2. `rooms` - Room definitions
3. `room_members` - Membership with RBAC
4. `invite_links` - Invite token management
5. `content_items` - File/document metadata
6. `password_reset_tokens` - Password reset flow
7. `email_verification_tokens` - Email verification

---

## Frontend Application (`apps/frontend/`)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies (React, Vite, etc.) |
| `tsconfig.json` | Frontend TypeScript config |
| `vite.config.ts` | Vite dev server + API proxy config |
| `tailwind.config.js` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS plugin config |
| `.env.example` | Environment variables template |
| `.env` | Local environment (create from example) |
| `index.html` | HTML entry point for Vite |

### Source Code
| File | Purpose |
|------|---------|
| `src/main.tsx` | React DOM render entry point |
| `src/App.tsx` | Root component with routing |
| `src/index.css` | Global styles + Tailwind setup |

### Components
| File | Purpose |
|------|---------|
| `src/components/Layout.tsx` | Main layout wrapper (sidebar + header + content) |
| `src/components/Header.tsx` | Top navigation bar |
| `src/components/Sidebar.tsx` | Left sidebar navigation |

### Pages
| File | Purpose |
|------|---------|
| `src/pages/Login.tsx` | Login page (email/password form) |
| `src/pages/Dashboard.tsx` | Dashboard page (room list, API status) |

### State Management
| File | Purpose |
|------|---------|
| `src/store/index.ts` | Zustand stores (auth state, UI state) |

---

## Shared Packages

### Types Package (`packages/types/`)
| File | Purpose |
|------|---------|
| `package.json` | Package config |
| `src/index.ts` | 100+ TypeScript interfaces and types |

**Exports**: User, Room, RoomMember, InviteLink, ContentItem, API request/response types

### API Client Package (`packages/api-client/`)
| File | Purpose |
|------|---------|
| `package.json` | Package config |
| `src/index.ts` | ApiClient class with 23 methods |

**Exports**: 
- `apiClient` - Singleton HTTP client
- Methods for all CRUD operations (auth, rooms, invites, content, members)

**Example Usage**:
```typescript
import { apiClient } from '@nexus/api-client';

const rooms = await apiClient.getRooms();
const health = await apiClient.getHealthStatus();
```

### UI Package (`packages/ui/`)
| File | Purpose |
|------|---------|
| `package.json` | Package config |
| `src/index.ts` | Component exports |
| `src/button.tsx` | Reusable Button component |

**Exports**: Button component (size: sm/md/lg, variant: primary/secondary/danger)

---

## NPM Scripts Summary

### All Workspaces
```bash
npm install              # Install all dependencies
npm run dev              # Start all dev servers in parallel
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run format           # Format with Prettier
npm run format:check     # Check Prettier compliance
npm run clean            # Remove build artifacts
```

### Backend Only
```bash
npm run dev -w apps/backend
npm run build -w apps/backend
```

### Frontend Only
```bash
npm run dev -w apps/frontend
npm run build -w apps/frontend
```

### Database Commands (from apps/backend/)
```bash
npx prisma migrate dev              # Run migrations
npx prisma migrate reset            # Reset database
npx prisma generate                 # Generate client
npx prisma studio                   # Open GUI browser
```

---

## Development Workflow

### First Time Setup
```bash
# 1. Install all dependencies
npm install

# 2. Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 3. Start Docker services
docker-compose up -d

# 4. Initialize database
cd apps/backend
npx prisma migrate dev --name init
cd ../..

# 5. Start dev servers
npm run dev
```

### Daily Development
```bash
# Terminal 1: Start all dev servers
npm run dev

# Terminal 2: Check database (optional)
cd apps/backend && npx prisma studio

# Browser: Open http://localhost:5173
```

### When Adding Files
```bash
# After adding/modifying files:
npm run lint              # Check for errors
npm run format            # Auto-fix formatting
git status                # Check what changed
git add .
git commit -m "feat: description"
```

---

## Architecture Overview

```
Frontend (React 18 + Vite)
├── src/
│   ├── pages/          # Login, Dashboard
│   ├── components/     # Layout, Header, Sidebar
│   ├── store/          # Zustand (auth, UI)
│   └── api/            # @nexus/api-client usage
└── Routes: /login, /

Backend (Node.js + Fastify)
├── src/
│   └── server.ts       # Main entry point
├── prisma/
│   ├── schema.prisma   # Database definition
│   └── migrations/     # Auto-generated
└── API Routes: /api/v1/*

Shared Packages
├── @nexus/types        # TypeScript interfaces
├── @nexus/api-client   # HTTP client (23 methods)
└── @nexus/ui           # UI components
```

---

## Key Technologies

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Frontend** | React | 18.2 | Concurrent features, large ecosystem |
| **Build** | Vite | 5.x | Sub-second HMR, fast builds |
| **State** | Zustand | 4.x | Lightweight, no boilerplate |
| **Backend** | Fastify | 4.x | 2-3× faster than Express |
| **Database** | PostgreSQL | 16 | Relational, JSONB, RLS support |
| **ORM** | Prisma | 5.x | Type-safe, auto-migrations |
| **Styling** | Tailwind | 3.x | Utility-first, responsive |
| **Monorepo** | Turborepo | 1.10 | Smart caching, parallel runs |

---

## Import Path Aliases

Configure in `tsconfig.json` and accessible from any file:

```typescript
// Instead of:
import { User } from '../../../packages/types';

// You can use:
import { User } from '@nexus/types';

// Same for api-client and ui packages
import { apiClient } from '@nexus/api-client';
import { Button } from '@nexus/ui';
```

---

## Environment Variables

### Backend (.env)
```env
HOST=0.0.0.0
PORT=3001
DATABASE_URL=postgresql://...
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...
REFRESH_TOKEN_SECRET=...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_APP_URL=http://localhost:5173
```

---

## Docker Services

Running via `docker-compose.yml`:

| Service | Image | Port | Volume |
|---------|-------|------|--------|
| PostgreSQL | postgres:16-alpine | 5432 | postgres_data |
| Redis | redis:7-alpine | 6379 | redis_data |

**Start**: `docker-compose up -d`  
**Stop**: `docker-compose down`  
**Logs**: `docker-compose logs -f`

---

## Git Version Control

### Setup
```bash
git init                           # Already set up
git config user.name "Your Name"
git config user.email "your@email.com"
```

### Workflow
```bash
git checkout -b feature/description
# ... make changes ...
npm run format
npm run lint
git add .
git commit -m "feat: add feature description"
git push origin feature/description
# Create pull request
```

---

## Performance Baseline

| Metric | Measurement | Target |
|--------|-------------|--------|
| Initial JS | ~500KB (dev), ~150KB (prod gzip) | < 3 MB |
| Dev startup | < 500ms | < 1s |
| Health check | < 10ms | < 100ms |
| Hot reload | < 100ms | < 1s |
| Build time | ~5s (cached) | < 30s |

---

## Next Steps (Phase 2)

### Week 1: Authentication
- [ ] Implement password hashing (bcrypt)
- [ ] Create JWT flow (login, logout, refresh)
- [ ] Email verification backend
- [ ] Connect frontend login form

### Week 2: Core Features
- [ ] Room CRUD operations
- [ ] Invite link generation
- [ ] File upload presigning
- [ ] API endpoint testing

See [NEXUS_ROOMS_MVP.md](./NEXUS_ROOMS_MVP.md#7-development-roadmap) for full roadmap.

---

## Troubleshooting Quick Links

**Issue**: Port already in use  
**Solution**: See [README.md - Troubleshooting](./README.md#troubleshooting)

**Issue**: Database connection error  
**Solution**: Check Docker is running: `docker-compose ps`

**Issue**: API client not connecting  
**Solution**: Verify backend running: `curl http://localhost:3001/api/v1/health`

**Issue**: TypeScript errors  
**Solution**: Run `npm run lint` and check for strict mode violations

---

## File Size Reference

### Production Bundles (Estimated)
- Frontend JS bundle: ~150-200 KB (gzipped)
- Backend image: ~150 MB (Docker)
- Database schema: ~1 KB (SQL)

---

**Last Updated**: May 4, 2026  
**Version**: 1.0-Foundation  
**Status**: ✅ Complete and Ready for Development
