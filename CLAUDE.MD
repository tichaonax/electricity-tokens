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

## ✅ Checkpoint 5.1 Completed: Usage Reports

### 5.1 Usage Report Features ✅
- Monthly usage trends chart with line/bar toggle ✅
- Cost per kWh analysis over time with premium tracking ✅
- Individual vs group usage comparison with performance insights ✅
- Emergency purchase impact analysis with financial breakdown ✅

**Status**: All four usage report types implemented with Chart.js integration!

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

## Testing Chart Functionality

### Quick Test Steps:
1. **Start the dev server**: `npm run dev`
2. **Visit test page**: http://localhost:3000/test-charts
3. **Seed test data**: Click "Seed Test Data" (admin only)
4. **Test reports**: Click "Test Usage Reports"

### Manual Testing:
1. **Navigate to reports**: `/dashboard/reports/usage`
2. **Test all 4 report types**:
   - Monthly Usage Trends
   - Cost Analysis Over Time 
   - Individual vs Group Usage
   - Emergency Purchase Impact
3. **Test date filters**: This Month, Last 3 Months, All Time, Custom dates
4. **Test interactions**: Chart toggles, hover effects, data tables

### API Endpoints for Testing:
- `GET /api/test-data` - Check current database contents
- `POST /api/seed-test-data` - Create sample data (admin only)
- `GET /api/reports/usage?type=monthly-trends` - Test monthly trends
- `GET /api/reports/usage?type=cost-analysis` - Test cost analysis  
- `GET /api/reports/usage?type=user-comparison` - Test user comparison
- `GET /api/reports/usage?type=emergency-impact` - Test emergency impact

## Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to projectplan.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made.
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the projectplan.md file with a summary of the changes you made and any other relevant information.