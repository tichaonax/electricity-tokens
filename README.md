# ⚡ Electricity Tokens Tracker

A modern, full-featured web application for households to fairly track and share electricity costs based on actual consumption.

## 🎯 Overview

**Core Principle**: 1 Token = 1 kWh (kilowatt-hour) of electricity

This application helps households manage shared electricity costs by:
- Tracking electricity token purchases
- Recording individual usage through meter readings
- Calculating fair cost shares based on actual consumption
- Providing analytics and optimization recommendations

## ✨ Key Features

### 🎨 **Modern User Experience**
- **Dark/Light Theme**: Full theme system with user preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with keyboard navigation
- **Progressive Web App**: Install on mobile devices

### 💰 **Fair Cost Sharing**
- **Proportional Calculations**: Pay based on actual usage
- **Real-time Validation**: Prevents data entry errors
- **Balance Tracking**: Monitor overpaid/underpaid status
- **Transparent Reporting**: Clear cost breakdowns

### 📊 **Analytics & Reports**
- **Usage Trends**: Monthly consumption patterns
- **Cost Analysis**: Efficiency metrics and optimization tips
- **Visual Charts**: Interactive graphs with dark mode support
- **Personal Dashboards**: Individual usage summaries

### 👥 **Admin Management**
- **User Management**: Account creation, roles, and permissions
- **Security Dashboard**: Audit logs and threat monitoring
- **Data Management**: Backup, restore, and export tools
- **System Monitoring**: Health checks and performance metrics

### 🔒 **Security & Reliability**
- **Role-based Access**: Admin and user permissions
- **Audit Logging**: Complete activity tracking
- **Data Validation**: Comprehensive input validation
- **Backup & Restore**: Full data recovery capabilities

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
   npx prisma migrate dev
   npx prisma generate
   ```

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
- **Next.js 14+** - React framework with App Router
- **Tailwind CSS v4** - Utility-first CSS with dark mode
- **TypeScript** - Type-safe development
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Server-side API
- **Prisma ORM** - Type-safe database operations
- **PostgreSQL** - Production database
- **NextAuth.js** - Authentication system

### DevOps
- **Vercel** - Deployment platform
- **GitHub Actions** - CI/CD pipeline
- **ESLint & Prettier** - Code quality tools

## 📋 Usage

### For Household Members

1. **Create Account**: Register with email and password
2. **Add Purchases**: Record electricity token purchases with meter readings
3. **Track Usage**: Add contributions based on your meter readings
4. **Monitor Costs**: View reports to understand your consumption patterns

### For Administrators

1. **User Management**: Create accounts, assign roles, manage permissions
2. **System Monitoring**: Monitor security, audit logs, and system health
3. **Data Management**: Create backups, export data, manage system settings
4. **Analytics**: Access system-wide reports and usage patterns

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

- **Status**: ✅ Production Ready
- **Version**: 1.0.0
- **Last Updated**: July 3, 2025
- **Features**: All core features complete
- **Documentation**: Comprehensive guides available

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

**Built with ❤️ for fair electricity cost sharing**