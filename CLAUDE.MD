# Claude Context for Electricity Tokens App

This is an electricity usage tracking app built with Next.js, designed for managing shared electricity meters and calculating individual usage costs.

## ✅ Checkpoint 1 Completed: Project Setup and Foundation

### 1.1 Project Structure ✅
- Next.js 15.3.4 with TypeScript ✅
- ESLint, Prettier, and Husky pre-commit hooks ✅
- Organized folder structure ✅
- Environment variables template ✅

### 1.2 Database Setup ✅
- Database schema designed ✅
- Prisma ORM configured ✅
- Note: PostgreSQL not installed locally - will need setup for migrations

### 1.3 Authentication System ✅
- NextAuth.js configuration ✅
- User registration/login pages ✅
- Role-based access (admin, regular user) ✅
- Session management ✅

**Status**: Foundation complete and ready for Checkpoint 2!

## Key Features
- Token-based electricity tracking (1 token = 1 kWh)
- Multi-user shared meter management
- Cost calculation based on actual usage
- Emergency purchase tracking at higher rates
- Audit trails and user management
- Comprehensive reporting and analytics

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run type-check` - Run TypeScript checks
- `npm run format` - Format code with Prettier
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open Prisma Studio (database GUI)

## Database
- PostgreSQL with Prisma ORM
- Models: Users, TokenPurchases, UserContributions, AuditLogs

## Authentication
- NextAuth.js with role-based access
- Admin and regular user roles
- Account locking capabilities