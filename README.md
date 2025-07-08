# ⚡ Electricity Tokens Tracker

A modern, mobile-first web application for households to fairly track and share electricity costs based on actual consumption with comprehensive audit trails and user-specific preferences.

## 🎯 Overview

**Core Principle**: 1 Token = 1 kWh (kilowatt-hour) of electricity

This application helps households manage shared electricity costs by:

- Tracking electricity token purchases
- Recording individual usage through meter readings
- Calculating fair cost shares based on actual consumption
- Providing analytics and optimization recommendations

## ✨ Key Features

### 🎨 **Modern User Experience**

- **Persistent Theme Preferences**: User-specific theme settings (light/dark/system) that persist across sessions
- **Mobile-First Design**: Card-based layouts optimized for touch devices with no horizontal scrolling
- **Responsive Components**: Adaptive table-to-card layouts for optimal mobile viewing
- **Progressive Web App**: Install on mobile devices like a native app
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

### 💰 **Fair Cost Sharing**

- **Proportional Calculations**: Pay based on actual usage
- **Real-time Validation**: Prevents data entry errors
- **Balance Tracking**: Monitor overpaid/underpaid status
- **Transparent Reporting**: Clear cost breakdowns

### 📊 **Analytics & Reports**

- **Advanced Meter Reading Tracking**: Individual consumption monitoring with chronological validation
- **Running Balance Calculations**: Real-time balance updates using latest meter readings
- **Usage Trends**: Monthly consumption patterns with mobile-optimized charts
- **Cost Analysis**: Efficiency metrics and optimization tips
- **Visual Charts**: Interactive graphs with theme-aware styling
- **Personal Dashboards**: Individual usage summaries with anticipated payment calculations

### 👥 **Admin Management**

- **User Management**: Account creation, roles, and permissions
- **Security Dashboard**: Audit logs and threat monitoring
- **Data Management**: Backup, restore, and export tools
- **System Monitoring**: Health checks and performance metrics

### 🔒 **Security & Reliability**

- **Role-based Access**: Admin and user permissions with granular controls
- **Enhanced Audit Logging**: Complete activity tracking with IP addresses, user agents, and metadata
- **Creation/Modification Tracking**: Comprehensive audit trail showing who created or last modified each entry
- **Data Validation**: Comprehensive input validation with business rule enforcement
- **One-to-One Data Constraints**: Database-enforced relationship between purchases and contributions
- **Permission System**: Granular permissions with restricted default access to sensitive features
- **Backup & Restore**: Full data recovery capabilities with constraint validation and automatic balance fixing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm/yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd electricity-tokens
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database and auth settings
   ```

4. **Set up the database**

   ```bash
   # Interactive setup (recommended for first-time setup)
   npm run db:setup

   # Or automated setup
   npm run db:init

   # Or manual setup if above fails
   npx prisma generate
   npx prisma db push
   ```

   **⚠️ Important**: If you get a 500 error on first sign-in, run `npm run db:init` to initialize the database tables (includes 8 tables for v1.4.0). See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for troubleshooting and upgrade procedures.

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router and enhanced mobile optimizations
- **Tailwind CSS** - Utility-first CSS with persistent theme system
- **TypeScript** - Type-safe development with strict mode
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation with business rule enforcement

### Backend

- **Next.js API Routes** - Server-side API with enhanced error handling
- **Prisma ORM** - Type-safe database operations with audit logging
- **PostgreSQL** - Production database with optimized indexing
- **NextAuth.js** - Authentication system with comprehensive audit trail

### DevOps

- **Vercel** - Deployment platform
- **GitHub Actions** - CI/CD pipeline
- **ESLint & Prettier** - Code quality tools

## 📋 Usage

### For Household Members

1. **Create Account**: Register with email and password
2. **Set Theme Preference**: Choose your preferred theme (light/dark/system) - it will persist across sessions
3. **Add Purchases**: Record electricity token purchases with meter readings
4. **Record Meter Readings**: Track individual consumption with detailed meter reading entries
5. **Track Usage**: Add contributions based on your meter readings
6. **Monitor Costs**: View mobile-optimized reports to understand your consumption patterns
7. **Review Audit Trail**: See who created or modified entries for transparency

### For Administrators

1. **User Management**: Create accounts, assign roles, manage permissions and theme preferences
2. **Meter Reading Oversight**: View, edit, and manage all meter readings with audit information
3. **Enhanced Audit Access**: Review detailed modification history with IP addresses and user agents
4. **System Monitoring**: Monitor security, audit logs, and system health
5. **Data Management**: Create backups, export data, manage system settings
6. **Analytics**: Access system-wide reports and usage patterns with mobile optimization

## 📖 Documentation

- **[User Manual](USER_MANUAL.md)** - Complete user guide
- **[Feature Tutorials](FEATURE_TUTORIALS.md)** - Step-by-step tutorials
- **[API Documentation](API_DOCUMENTATION.md)** - API reference
- **[Database Schema](DATABASE_SCHEMA.md)** - Database structure
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment
- **[Security Guide](SECURITY.md)** - Security considerations
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

## 🔧 Development

### Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── reports/     # Chart and analytics components
│   └── admin/       # Admin-specific components
├── lib/             # Utilities and configurations
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

### Key Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma migrate dev    # Run database migrations
npx prisma studio        # Open database browser
npx prisma generate      # Generate Prisma client

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Import project in Vercel dashboard
2. **Set Environment Variables**: Add database and auth configuration
3. **Deploy**: Automatic deployment on every push to main branch

### Manual Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Set up production database**

   ```bash
   npx prisma migrate deploy
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## 📊 Application Status

- **Status**: ✅ Production Ready with Enhanced Security & Data Integrity
- **Version**: 1.4.0
- **Schema Version**: 1.4.0 (One-to-One Constraints + Enhanced Audit Logging + Permission System)
- **Last Updated**: July 8, 2025
- **Features**: All core features complete with mobile-first design and robust security
- **New in v1.4.0**: Database constraints, permission system, audit log metadata, backup improvements
- **Documentation**: Comprehensive guides available with latest changes documented

## 🤝 Contributing

This is a complete, production-ready application. For maintenance:

1. **Bug Reports**: Document issues with reproduction steps
2. **Feature Requests**: Discuss enhancements before implementation
3. **Code Quality**: Follow existing patterns and conventions
4. **Testing**: Ensure all changes are thoroughly tested

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the comprehensive guides in `/docs`
- **Issues**: Create detailed bug reports with reproduction steps
- **Security**: Report security issues privately to administrators

---

**Built with ❤️ for fair electricity cost sharing with mobile-first accessibility**

### 🆕 What's New in v1.4.0

- 📱 **Mobile-First Design**: Card-based layouts that work perfectly on phones and tablets
- 🎨 **Persistent Theme Preferences**: Your theme choice (light/dark/system) saves automatically
- 📊 **Enhanced Meter Reading System**: Individual consumption tracking with audit trails
- 🔍 **Comprehensive Audit Logging**: See who created or modified every entry with timestamps and metadata
- ⚡ **Improved Running Balance**: Uses latest meter readings for accurate payment calculations
- 🛡️ **Enhanced Security**: IP tracking, user agent logging, and granular permission system
- 🔗 **Database Constraints**: One-to-one purchase-contribution relationship enforced at database level
- 🔐 **Permission System**: Restricted default access with admin-controlled feature permissions
- 💾 **Improved Backup System**: Simplified API with constraint validation and automatic balance fixing
- 📋 **Upgrade Support**: Comprehensive migration procedures for existing deployments
