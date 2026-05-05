# Nexus Rooms - Foundation Setup

This is the foundational development environment for Nexus Rooms MVP. This repository is set up as a Turborepo monorepo with separate applications for frontend and backend, along with shared packages.

## Project Structure

```
nexus_rooms/
├── apps/
│   ├── backend/                 # Node.js + Fastify API server
│   │   ├── src/
│   │   │   └── server.ts       # Main Fastify server
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── package.json
│   │   └── .env.example
│   └── frontend/                # React 18 + Vite web app
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── pages/
│       │   ├── components/
│       │   └── store/
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json
│       └── .env.example
├── packages/
│   ├── types/                   # Shared TypeScript interfaces
│   │   └── src/index.ts
│   ├── api-client/              # HTTP client for API calls
│   │   └── src/index.ts
│   └── ui/                      # Shared UI components
│       ├── src/index.ts
│       └── src/button.tsx
├── package.json                 # Root package.json with workspaces
├── turbo.json                   # Turborepo config
├── tsconfig.json               # Base TypeScript config
├── .eslintrc.json              # ESLint config
├── .prettierrc                 # Prettier config
├── docker-compose.yml          # Local development services
└── README.md
```

## Prerequisites

- **Node.js:** v20.0.0 or higher
- **npm:** v10.0.0 or higher
- **Docker & Docker Compose:** For running PostgreSQL and Redis locally
- **Git:** For version control

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (root, apps/backend, apps/frontend, packages/*).

### 2. Set Up Environment Variables

#### Backend

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` and configure:

```env
DATABASE_URL=postgresql://nexus_user:nexus_password@localhost:5432/nexus_rooms_db
JWT_PRIVATE_KEY=<generate-a-private-key>
JWT_PUBLIC_KEY=<corresponding-public-key>
REFRESH_TOKEN_SECRET=<min-32-char-secret>
```

For development, you can generate RSA keys using:

```bash
# On macOS/Linux
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Or use online tools during development
```

#### Frontend

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Edit `apps/frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_APP_URL=http://localhost:5173
```

### 3. Start Database & Cache Services

```bash
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
```

### 4. Set Up Database Schema

From the backend directory:

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
```

This creates the database schema and generates Prisma client.

### 5. Start Development Servers

In separate terminal windows:

**Backend** (runs on `http://localhost:3001`):

```bash
npm run dev -w apps/backend
```

**Frontend** (runs on `http://localhost:5173`):

```bash
npm run dev -w apps/frontend
```

Or run both in parallel:

```bash
npm run dev
```

## Verification

### API Health Check

```bash
curl http://localhost:3001/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "version": "v1",
  "timestamp": "2026-05-04T10:00:00.000Z"
}
```

### Frontend

Open `http://localhost:5173` in your browser. You should see:
- **Login page** at `/login` (can access directly)
- **Dashboard** at `/` (shows API status when logged in)
- Sample buttons to verify UI components are working

## Development Workflow

### Commands

```bash
# Install dependencies for all workspaces
npm install

# Run all dev servers in parallel
npm run dev

# Build all packages and apps
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Check formatting without writing
npm run format:check

# Clean build artifacts
npm run clean
```

### Workspace Commands

Run commands in specific workspaces:

```bash
# Backend only
npm run dev -w apps/backend
npm run lint -w apps/backend

# Frontend only
npm run dev -w apps/frontend
npm run lint -w apps/frontend

# Types package
npm run lint -w packages/types

# API client
npm run lint -w packages/api-client
```

### Database Commands

```bash
# Run pending migrations
cd apps/backend
npx prisma migrate dev

# Open Prisma Studio (GUI for database)
npx prisma studio

# Generate Prisma client
npx prisma generate

# Reset database (caution: deletes all data)
npx prisma migrate reset
```

## Project Features (Phase 1 - Foundation)

✅ **Monorepo Setup**
- Turborepo for efficient builds and caching
- Shared packages (types, api-client, ui)
- TypeScript path aliases for clean imports

✅ **Backend**
- Fastify server running on port 3001
- PostgreSQL integration via Prisma ORM
- MVP database schema (7 tables)
- Health check endpoints
- Structured logging with Pino

✅ **Frontend**
- React 18 with TypeScript
- Vite for fast development
- React Router for page navigation
- Zustand for global state management
- Tailwind CSS for styling
- shadcn/ui component library ready
- API client integration

✅ **Developer Tools**
- ESLint for code linting
- Prettier for code formatting
- Git version control setup
- Docker Compose for local services

✅ **End-to-End Connectivity**
- Frontend can call backend API via configured proxy
- Health check endpoint validates connection
- Dashboard shows live API status

## Next Steps (Phase 2 - Authentication)

- [ ] Implement JWT authentication (login/signup)
- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Protected routes and RBAC enforcement

## Next Steps (Phase 3 - Rooms & File Sharing)

- [ ] Room CRUD operations
- [ ] Invite link generation and validation
- [ ] S3 integration for file storage
- [ ] File upload/download functionality

## Troubleshooting

### Docker services not starting

```bash
# Check docker daemon is running
docker ps

# Try rebuilding
docker-compose down
docker-compose up -d --build
```

### Prisma migration errors

```bash
# Reset database and try again
cd apps/backend
npx prisma migrate reset

# Or manually:
docker exec nexus-postgres dropdb -U nexus_user nexus_rooms_db
docker exec nexus-postgres createdb -U nexus_user nexus_rooms_db
npx prisma migrate dev --name init
```

### Port already in use

```bash
# Backend (3001)
lsof -i :3001
kill -9 <PID>

# Frontend (5173)
lsof -i :5173
kill -9 <PID>

# PostgreSQL (5432)
lsof -i :5432
kill -9 <PID>

# Redis (6379)
lsof -i :6379
kill -9 <PID>
```

### API client errors

Ensure:
1. Backend is running (`npm run dev -w apps/backend`)
2. Vite proxy is configured correctly in `vite.config.ts`
3. `.env` files are set with correct URLs

## Architecture Decisions

### Why Turborepo?

- **Monorepo efficiency**: Manages multiple packages/apps with smart caching
- **TypeScript path aliases**: Clean imports like `@nexus/types` instead of `../../../packages/types`
- **Parallel execution**: `npm run dev` runs all servers simultaneously
- **Code sharing**: DRY principle for types, API client, and UI components

### Why Fastify?

- **Performance**: 2-3× faster than Express in benchmarks
- **Built-in validation**: JSON schema support for API security
- **Plugin architecture**: Cleaner code organization
- **TypeScript first**: Excellent type support

### Why Prisma?

- **Type safety**: Auto-generated types from schema
- **Migrations**: Version-controlled database changes
- **Studio GUI**: Visual database browser for development
- **Developer experience**: Excellent documentation and tooling

### Why Zustand?

- **Lightweight**: < 1KB gzipped
- **Simple API**: Easy to learn and use
- **No boilerplate**: Minimal setup vs Redux
- **React 18 ready**: Perfect for Concurrent features

## Performance Targets (MVP)

- ✅ < 3 MB initial JavaScript bundle (frontend)
- ✅ Sub-second development server startup (Vite)
- ✅ Stateless backend (horizontal scaling ready)
- ✅ Connection pooling ready (Prisma + RDS)

## Security Notes

- **Development JWT keys**: Generate real keys for production
- **Environment variables**: Never commit `.env` files (in `.gitignore`)
- **Database password**: Change default credentials in production
- **HTTPS**: Required for production (set up via AWS ALB/CloudFront)

## Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Fastify Docs](https://www.fastify.io/)
- [React Docs](https://react.dev/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run linter: `npm run lint`
4. Format code: `npm run format`
5. Commit with clear message: `git commit -m "feat: add feature"`
6. Push and create a pull request

## License

Private project - Nexus Rooms

## Support

For issues or questions, refer to:
- [MVP Specification](./NEXUS_ROOMS_MVP.md)
- [MVP Quick Reference](./MVP_QUICK_REFERENCE.md)
- [Blueprint](./nexus_rooms_blueprint.md)

---

**Last Updated:** May 2026  
**Version:** 1.0-Foundation  
**Status:** Ready for Development
