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

## ✅ Checkpoint 3.3 Completed: Cost Calculation Engine

### 3.3.1 Core Calculation Library ✅
- Proportional cost calculation based on actual usage ✅
- Multiple purchases within same period handling ✅
- True cost per kWh calculation for each user ✅
- Emergency purchase rate calculations and premiums ✅

### 3.3.2 API Implementation ✅
- Cost analysis endpoint with multiple analysis types ✅
- Authentication and authorization checks ✅
- User, period, recommendations, and optimal analysis modes ✅
- Comprehensive data fetching and processing ✅

### 3.3.3 User Interface ✅
- Interactive cost analysis component ✅
- Multiple view types (breakdown, recommendations, optimal) ✅
- Real-time efficiency scoring and recommendations ✅
- Responsive design with comprehensive data visualization ✅

### 3.3.4 Dashboard Integration ✅
- Dedicated cost analysis page ✅
- Main dashboard integration with cost analysis card ✅
- Navigation and user experience optimization ✅

**Status**: Cost Calculation Engine complete with production-ready implementation!

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