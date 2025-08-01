# Electricity Tokens Tracker - API Documentation

## Overview

This document provides comprehensive documentation for the Electricity Tokens Tracker API. The application is built with Next.js and provides RESTful API endpoints for managing electricity usage tracking, token purchases, user contributions, and system administration.

## Base URL

```
http://localhost:3000/api (Development)
https://your-domain.vercel.app/api (Production)
```

## Authentication

The API uses NextAuth.js for authentication. Most endpoints require authentication except for registration and health checks.

### Authentication Headers

```
Authorization: Bearer <session-token>
```

## Core Data Models

### User

```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  locked: boolean;
  passwordResetRequired: boolean;
  permissions: object | null;
  themePreference: 'light' | 'dark' | 'system';
  lastLoginAt: DateTime | null; // New field for tracking last login
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### TokenPurchase

```typescript
{
  id: string;
  totalTokens: number;
  totalPayment: number;
  meterReading: number;
  purchaseDate: DateTime;
  isEmergency: boolean;
  createdById: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### UserContribution

```typescript
{
  id: string;
  purchaseId: string; // UNIQUE - enforces one-to-one relationship with purchase
  userId: string;
  contributionAmount: number;
  meterReading: number;
  tokensConsumed: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Important Constraints:**
- Each TokenPurchase must have exactly one UserContribution
- Each UserContribution belongs to exactly one TokenPurchase  
- The `purchaseId` field is unique to enforce this one-to-one relationship
- Deletion of TokenPurchase is restricted if UserContribution exists
- Deletion of UserContribution cascades when User is deleted

### MeterReading

```typescript
{
  id: string;
  userId: string;
  reading: number;
  readingDate: DateTime;
  notes: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### AuditLog

```typescript
{
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: object | null;
  newValues: object | null;
  metadata: object | null; // New field for storing IP address, user agent, etc.
  timestamp: DateTime;
}
```

## Permissions System

The application implements a comprehensive role-based permission system that controls access to various features and data. Users can have fine-grained permissions that determine what actions they can perform within the system.

### Permission Structure

User permissions are stored as a JSON object in the `permissions` field of the User model. Each permission is a boolean flag that grants or denies access to specific functionality.

### Available Permissions

#### Purchase Management

- `canAddPurchases`: Can create new token purchases
- `canEditPurchases`: Can modify existing purchases
- `canDeletePurchases`: Can delete purchases

#### Contribution Management

- `canAddContributions`: Can create new user contributions
- `canEditContributions`: Can modify existing contributions
- `canDeleteContributions`: Can delete contributions

#### Meter Reading Management

- `canAddMeterReadings`: Can record new meter readings

#### Reports Access (Special Permissions)

- `canViewUsageReports`: Can access usage analytics and reports _(Special Permission)_
- `canViewFinancialReports`: Can view financial summaries and reports _(Special Permission)_
- `canViewEfficiencyReports`: Can access efficiency analysis reports _(Special Permission)_

> **Note**: Reports access permissions are now special permissions that must be explicitly granted by administrators.

#### Personal Dashboard

- `canViewPersonalDashboard`: Can access the personal dashboard
- `canViewAccountBalance`: Can view account balance information _(New)_
- `canViewProgressiveTokenConsumption`: Can view progressive token consumption widget _(New)_
- `canViewMaximumDailyConsumption`: Can view maximum daily consumption widget _(New)_

#### Dashboard Access Control (Special Permissions)

- `canViewPurchaseHistory`: Can view purchase history and filtering tools _(Special Permission)_
- `canAccessNewPurchase`: Can access new purchase creation form _(Special Permission)_
- `canViewUserContributions`: Can view user contributions interface _(Special Permission)_
- `canViewCostAnalysis`: Can view cost analysis features _(Special Permission)_

> **Note**: These are special permissions that control access to core dashboard features. They are not included in default user permissions and must be explicitly granted by administrators.

#### Data Management

- `canExportData`: Can export system data
- `canImportData`: Can import data into the system

### Default Permission Sets

#### Regular Users (DEFAULT_USER_PERMISSIONS)

```json
{
  "canAddPurchases": true,
  "canEditPurchases": false,
  "canDeletePurchases": false,
  "canAddContributions": true,
  "canEditContributions": true,
  "canDeleteContributions": false,
  "canAddMeterReadings": false,
  "canViewUsageReports": false,
  "canViewFinancialReports": false,
  "canViewEfficiencyReports": false,
  "canViewPersonalDashboard": true,
  "canViewCostAnalysis": false,
  "canViewAccountBalance": false,
  "canViewProgressiveTokenConsumption": false,
  "canViewMaximumDailyConsumption": false,
  "canViewPurchaseHistory": false,
  "canAccessNewPurchase": false,
  "canViewUserContributions": false,
  "canExportData": false,
  "canImportData": false
}
```

#### Admin Users (ADMIN_PERMISSIONS)

Administrators automatically receive all permissions set to `true`.

#### Read-Only Users (READ_ONLY_PERMISSIONS)

```json
{
  "canAddPurchases": false,
  "canEditPurchases": false,
  "canDeletePurchases": false,
  "canAddContributions": false,
  "canEditContributions": false,
  "canDeleteContributions": false,
  "canAddMeterReadings": false,
  "canViewUsageReports": false,
  "canViewFinancialReports": false,
  "canViewEfficiencyReports": false,
  "canViewPersonalDashboard": true,
  "canViewCostAnalysis": false,
  "canViewAccountBalance": false,
  "canViewProgressiveTokenConsumption": false,
  "canViewMaximumDailyConsumption": false,
  "canViewPurchaseHistory": false,
  "canAccessNewPurchase": false,
  "canViewUserContributions": false,
  "canExportData": false,
  "canImportData": false
}
```

#### Contributor-Only Users (CONTRIBUTOR_ONLY_PERMISSIONS)

```json
{
  "canAddPurchases": false,
  "canEditPurchases": false,
  "canDeletePurchases": false,
  "canAddContributions": true,
  "canEditContributions": true,
  "canDeleteContributions": false,
  "canAddMeterReadings": false,
  "canViewUsageReports": false,
  "canViewFinancialReports": false,
  "canViewEfficiencyReports": false,
  "canViewPersonalDashboard": true,
  "canViewCostAnalysis": false,
  "canViewAccountBalance": false,
  "canExportData": false,
  "canImportData": false
}
```

### Permission Inheritance

- **Admin Role**: Automatically has all permissions regardless of the `permissions` field
- **User Role**: Uses custom permissions if set, otherwise falls back to `DEFAULT_USER_PERMISSIONS`
- **Unauthenticated**: No permissions granted

### Account Balance Permission

The `canViewAccountBalance` permission was added to control visibility of account balance information on the dashboard. This sensitive financial information is now restricted by default for regular users and must be explicitly granted by an administrator.

**Impact:**

- Regular users will not see the "Account Balance" badge on their dashboard by default
- Administrators retain full access to all financial information
- This permission can be granted individually to trusted users who need balance visibility

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

### Purchase Management

#### GET /api/purchases

Retrieve paginated list of token purchases.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search term for filtering
- `sortBy`: Sort field ('purchaseDate', 'totalTokens', 'totalPayment')
- `sortOrder`: Sort direction ('asc', 'desc')

**Response:**

```json
{
  "purchases": [
    {
      "id": "purchase_id",
      "totalTokens": 100,
      "totalPayment": 150.0,
      "meterReading": 5000,
      "purchaseDate": "2024-01-15T10:00:00Z",
      "isEmergency": false,
      "creator": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "contribution": {
        "id": "contribution_id",
        "contributionAmount": 30.0,
        "meterReading": 5025,
        "tokensConsumed": 25
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

#### POST /api/purchases

Create a new token purchase.

**Request Body:**

```json
{
  "totalTokens": 100,
  "totalPayment": 150.0,
  "meterReading": 5000,
  "purchaseDate": "2024-01-15T10:00:00Z",
  "isEmergency": false
}
```

**Response:**

```json
{
  "message": "Purchase created successfully",
  "purchase": {
    "id": "purchase_id",
    "totalTokens": 100,
    "totalPayment": 150.0,
    "meterReading": 5000,
    "purchaseDate": "2024-01-15T10:00:00Z",
    "isEmergency": false,
    "createdById": "user_id"
  }
}
```

#### GET /api/purchases/[id]

Get specific purchase details.

**Response:**

```json
{
  "id": "purchase_id",
  "totalTokens": 100,
  "totalPayment": 150.0,
  "meterReading": 5000,
  "purchaseDate": "2024-01-15T10:00:00Z",
  "isEmergency": false,
  "creator": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "contribution": {
    "id": "contribution_id",
    "contributionAmount": 30.0,
    "meterReading": 5025,
    "tokensConsumed": 25
  }
}
```

#### PUT /api/purchases/[id]

Update an existing purchase (Admin only).

**Request Body:**

```json
{
  "totalTokens": 120,
  "totalPayment": 180.0,
  "meterReading": 5100,
  "purchaseDate": "2024-01-15T10:00:00Z",
  "isEmergency": true
}
```

#### DELETE /api/purchases/[id]

Delete a purchase (Admin only, with constraints).

**Response:**

```json
{
  "message": "Purchase deleted successfully"
}
```

#### GET /api/purchases/[id]/context

Get purchase context for editing (previous/next purchases).

**Response:**

```json
{
  "previousPurchase": {
    "id": "prev_id",
    "meterReading": 4900,
    "purchaseDate": "2024-01-10T10:00:00Z"
  },
  "nextPurchase": {
    "id": "next_id",
    "meterReading": 5200,
    "purchaseDate": "2024-01-20T10:00:00Z"
  }
}
```

#### GET /api/purchases/[id]/impact-analysis

Analyze impact of purchase changes on contributions.

**Response:**

```json
{
  "affectedContributions": [
    {
      "id": "contribution_id",
      "userId": "user_id",
      "userName": "John Doe",
      "currentAmount": 30.0,
      "newAmount": 35.0,
      "difference": 5.0
    }
  ],
  "summary": {
    "totalAffected": 3,
    "totalDifference": 15.0
  }
}
```

### Contribution Management

#### GET /api/contributions

Get paginated list of user contributions.

**Query Parameters:**

- `page`: Page number
- `limit`: Items per page
- `userId`: Filter by user ID
- `purchaseId`: Filter by purchase ID

**Response:**

```json
{
  "contributions": [
    {
      "id": "contribution_id",
      "contributionAmount": 30.0,
      "meterReading": 5025,
      "tokensConsumed": 25,
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "purchase": {
        "id": "purchase_id",
        "totalTokens": 100,
        "purchaseDate": "2024-01-15T10:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /api/contributions

Create a new user contribution.

**Request Body:**

```json
{
  "purchaseId": "purchase_id",
  "contributionAmount": 30.0,
  "meterReading": 5025
}
```

**Response:**

```json
{
  "message": "Contribution created successfully",
  "contribution": {
    "id": "contribution_id",
    "purchaseId": "purchase_id",
    "userId": "user_id",
    "contributionAmount": 30.0,
    "meterReading": 5025,
    "tokensConsumed": 25
  }
}
```

#### PUT /api/contributions/[id]

Update an existing contribution.

**Request Body:**

```json
{
  "contributionAmount": 35.0,
  "meterReading": 5030
}
```

#### DELETE /api/contributions/[id]

Delete a contribution.

**Response:**

```json
{
  "message": "Contribution deleted successfully"
}
```

### User Management

#### GET /api/users

Get paginated list of users (Admin only).

**Query Parameters:**

- `page`: Page number
- `limit`: Items per page
- `search`: Search by name or email
- `role`: Filter by role ('USER', 'ADMIN')
- `locked`: Filter by locked status

**Response:**

```json
{
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "locked": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

#### GET /api/users/[id]

Get specific user details.

**Response:**

```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "locked": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

#### PUT /api/users/[id]

Update user details (Admin only).

**Request Body:**

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "ADMIN",
  "locked": false,
  "passwordResetRequired": false,
  "permissions": {
    "canCreateMeterReading": true,
    "canViewAuditLogs": false
  }
}
```

### User Theme Management

#### GET /api/user/theme

Get current user's theme preference.

**Response:**

```json
{
  "theme": "dark"
}
```

#### PUT /api/user/theme

Update current user's theme preference.

**Request Body:**

```json
{
  "theme": "dark"
}
```

**Response:**

```json
{
  "message": "Theme preference updated successfully"
}
```

### Meter Reading Management

#### GET /api/meter-readings

Get paginated list of meter readings with audit information.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `startDate`: Filter by date range
- `endDate`: Filter by date range

**Response:**

```json
{
  "meterReadings": [
    {
      "id": "reading_id",
      "userId": "user_id",
      "reading": 1362.5,
      "readingDate": "2024-01-15T10:00:00Z",
      "notes": "Monthly reading",
      "createdAt": "2024-01-15T10:05:00Z",
      "updatedAt": "2024-01-15T10:05:00Z",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "latestUpdateAudit": {
        "id": "audit_id",
        "action": "UPDATE",
        "timestamp": "2024-01-15T12:00:00Z",
        "user": {
          "id": "modifier_id",
          "name": "Admin User",
          "email": "admin@example.com"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /api/meter-readings

Create a new meter reading.

**Request Body:**

```json
{
  "reading": 1362.5,
  "readingDate": "2024-01-15T10:00:00Z",
  "notes": "Monthly reading"
}
```

**Response:**

```json
{
  "message": "Meter reading created successfully",
  "meterReading": {
    "id": "reading_id",
    "userId": "user_id",
    "reading": 1362.5,
    "readingDate": "2024-01-15T10:00:00Z",
    "notes": "Monthly reading",
    "createdAt": "2024-01-15T10:05:00Z"
  }
}
```

#### PUT /api/meter-readings/[id]

Update an existing meter reading.

**Request Body:**

```json
{
  "reading": 1365.0,
  "readingDate": "2024-01-15T10:00:00Z",
  "notes": "Corrected reading"
}
```

#### DELETE /api/meter-readings/[id]

Delete a meter reading.

**Response:**

```json
{
  "message": "Meter reading deleted successfully"
}
```

#### GET /api/meter-readings/latest

Get the latest global meter reading from all users.

**Response:**

```json
{
  "reading": 1425.7,
  "readingDate": "2024-01-20T15:30:00Z",
  "userName": "John Doe",
  "message": "Latest global meter reading"
}
```

**Response (No readings available):**

```json
{
  "reading": null,
  "readingDate": null,
  "userName": null,
  "message": "No meter readings available"
}
```

### Reporting Endpoints

#### GET /api/reports/usage

Get usage analytics and reports.

**Query Parameters:**

- `period`: 'monthly', 'quarterly', 'yearly'
- `startDate`: Start date for analysis
- `endDate`: End date for analysis
- `userId`: Filter by specific user

**Response:**

```json
{
  "monthlyTrends": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      {
        "label": "Tokens Consumed",
        "data": [120, 150, 180],
        "backgroundColor": "#3b82f6"
      }
    ]
  },
  "costAnalysis": {
    "totalCost": 450.0,
    "averageCostPerToken": 1.5,
    "emergencyPurchaseImpact": 50.0
  },
  "summary": {
    "totalTokens": 300,
    "totalCost": 450.0,
    "averageMonthlyUsage": 150
  }
}
```

#### GET /api/reports/financial

Get financial reports and analysis.

**Response:**

```json
{
  "monthlySummary": {
    "period": "2024-01",
    "totalSpent": 300.0,
    "tokensPerDollar": 2.5,
    "efficiency": "good"
  },
  "paymentTracking": [
    {
      "userId": "user_id",
      "userName": "John Doe",
      "totalContributed": 150.0,
      "expectedContribution": 120.0,
      "balance": 30.0
    }
  ],
  "annualOverview": {
    "totalSpent": 3600.0,
    "totalTokens": 2400,
    "averageRate": 1.5
  }
}
```

#### GET /api/reports/efficiency

Get efficiency metrics and optimization suggestions.

**Response:**

```json
{
  "tokenLossAnalysis": {
    "emergencyPurchases": 3,
    "extraCostFromEmergencies": 75.0,
    "potentialSavings": 75.0
  },
  "purchaseOptimization": {
    "recommendedPurchaseSize": 200,
    "optimalFrequency": "weekly",
    "nextRecommendedPurchase": "2024-02-01"
  },
  "usagePrediction": {
    "nextMonthPrediction": 180,
    "confidence": 0.85,
    "trend": "increasing"
  }
}
```

### Validation Endpoints

#### POST /api/validate-meter-reading

Validate meter reading for new purchases.

**Request Body:**

```json
{
  "meterReading": 5100,
  "purchaseDate": "2024-01-20T10:00:00Z"
}
```

**Response:**

```json
{
  "isValid": true,
  "message": "Meter reading is valid",
  "constraints": {
    "minimumReading": 5000,
    "previousPurchase": {
      "id": "prev_id",
      "meterReading": 5000,
      "date": "2024-01-15T10:00:00Z"
    }
  }
}
```

#### POST /api/validate-contribution-meter

Validate meter reading for contributions.

**Request Body:**

```json
{
  "purchaseId": "purchase_id",
  "meterReading": 5025
}
```

**Response:**

```json
{
  "isValid": true,
  "message": "Contribution meter reading is valid",
  "constraints": {
    "purchaseMeterReading": 5000,
    "minimumReading": 5000,
    "tokensConsumed": 25
  }
}
```

#### POST /api/validate-sequential-purchase

Validate purchase sequence integrity.

**Request Body:**

```json
{
  "purchaseId": "purchase_id",
  "newMeterReading": 5150
}
```

### Dashboard and Analytics

#### GET /api/dashboard

Get personalized dashboard data for current user.

**Response:**

```json
{
  "recentActivity": [
    {
      "type": "contribution",
      "amount": 30.0,
      "date": "2024-01-15T10:00:00Z",
      "purchase": {
        "id": "purchase_id",
        "totalTokens": 100
      }
    }
  ],
  "summary": {
    "totalContributions": 450.0,
    "totalTokensConsumed": 300,
    "averageMonthlyUsage": 150,
    "currentBalance": 25.0
  },
  "upcomingRecommendations": [
    "Consider contributing to Purchase #123",
    "Optimize usage during peak hours"
  ]
}
```

#### GET /api/dashboard/running-balance

Get comprehensive running balance data with anticipated payment predictions.

**Description:**
This endpoint provides real-time account balance information and smart predictions for future token purchase costs based on current usage and historical patterns.

**Response:**

```json
{
  "contributionBalance": -4.75,
  "totalContributed": 77.0,
  "totalConsumed": 288.0,
  "totalFairShareCost": 81.6,
  "averageDaily": 9.6,
  "status": "warning",
  "lastWeekConsumption": 0.0,
  "lastWeekContributed": 0.0,
  "consumptionTrend": "stable",
  "trendPercentage": 0.0,
  "tokensConsumedSinceLastContribution": 24.6,
  "estimatedCostSinceLastContribution": -6.97,
  "anticipatedPayment": -11.72,
  "historicalCostPerKwh": 0.283,
  "anticipatedOthersPayment": -10.33,
  "anticipatedTokenPurchase": -22.05
}
```

**Response Fields:**

| Field                                 | Type   | Description                                                  |
| ------------------------------------- | ------ | ------------------------------------------------------------ |
| `contributionBalance`                 | number | Current account balance (negative = debt, positive = credit) |
| `totalContributed`                    | number | Total amount user has contributed to date                    |
| `totalConsumed`                       | number | Total kWh consumed by user                                   |
| `totalFairShareCost`                  | number | What user should have paid based on consumption              |
| `averageDaily`                        | number | Average daily consumption in kWh                             |
| `status`                              | string | Balance status: "healthy", "warning", or "critical"          |
| `lastWeekConsumption`                 | number | kWh consumed in the last 7 days                              |
| `lastWeekContributed`                 | number | Amount contributed in the last 7 days                        |
| `consumptionTrend`                    | string | Usage trend: "increasing", "decreasing", or "stable"         |
| `trendPercentage`                     | number | Percentage change in consumption trend                       |
| `tokensConsumedSinceLastContribution` | number | kWh used since last token purchase                           |
| `estimatedCostSinceLastContribution`  | number | Cost of usage since last purchase (negative = cost)          |
| `anticipatedPayment`                  | number | **NEW:** Predicted amount user needs to pay                  |
| `historicalCostPerKwh`                | number | **NEW:** Average historical rate per kWh                     |
| `anticipatedOthersPayment`            | number | **NEW:** Predicted amount others will contribute             |
| `anticipatedTokenPurchase`            | number | **NEW:** Total recommended token purchase amount             |

**Anticipated Payment Algorithm:**

- `anticipatedPayment = contributionBalance + estimatedCostSinceLastContribution`
- `anticipatedOthersPayment = estimatedCostSinceLastContribution × (othersHistoricalUsage ÷ userHistoricalFairShare)`
- `anticipatedTokenPurchase = anticipatedPayment + anticipatedOthersPayment`

#### GET /api/contribution-progress

Get contribution progress for current user.

**Response:**

```json
{
  "pendingContributions": [
    {
      "purchaseId": "purchase_id",
      "purchaseDate": "2024-01-15T10:00:00Z",
      "totalTokens": 100,
      "suggestedContribution": 35.0
    }
  ],
  "totalPending": 1,
  "totalSuggestedAmount": 35.0
}
```

### System Administration

#### GET /api/health

System health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "pass",
      "latency": 25
    },
    "environment": {
      "status": "pass"
    },
    "memory": {
      "status": "pass",
      "message": "128MB used"
    }
  }
}
```

#### GET /api/admin/database-performance

Get database performance information and index status (Admin only).

**Response:**

```json
{
  "indexes": [
    {
      "name": "TokenPurchase_purchaseDate_idx",
      "exists": true,
      "description": "Optimizes purchase date sorting",
      "tableName": "TokenPurchase",
      "estimatedImpact": "high"
    },
    {
      "name": "TokenPurchase_creator_name_idx",
      "exists": false,
      "description": "Improves creator name search performance",
      "tableName": "TokenPurchase",
      "estimatedImpact": "medium"
    }
  ],
  "stats": {
    "totalQueries": 1250,
    "avgQueryTime": 15.2,
    "slowQueries": 25,
    "indexHitRatio": 95.0,
    "lastOptimized": "2024-01-15T14:30:00Z"
  }
}
```

#### POST /api/admin/database-performance/optimize

Run database optimization by creating missing indexes (Admin only).

**⚠️ Warning**: This operation may temporarily affect database performance and should be run during low-traffic periods.

**Response:**

```json
{
  "success": true,
  "indexesCreated": 3,
  "results": [
    {
      "name": "TokenPurchase_purchaseDate_idx",
      "status": "success",
      "message": "Index created successfully"
    },
    {
      "name": "TokenPurchase_creator_name_idx",
      "status": "success",
      "message": "Index created successfully"
    },
    {
      "name": "TokenPurchase_contribution_null_idx",
      "status": "success",
      "message": "Index created successfully"
    }
  ],
  "message": "Database optimization completed. 3 indexes processed."
}
```

#### GET /api/audit

Get system audit logs (Admin only).

**Query Parameters:**

- `page`: Page number
- `limit`: Items per page
- `userId`: Filter by user
- `action`: Filter by action type
- `entityType`: Filter by entity type
- `entityId`: Filter by specific entity ID
- `startDate`: Start date filter
- `endDate`: End date filter

**Response:**

```json
{
  "auditLogs": [
    {
      "id": "audit_id",
      "userId": "user_id",
      "action": "CREATE",
      "entityType": "MeterReading",
      "entityId": "reading_id",
      "oldValues": null,
      "newValues": {
        "reading": 1362.5,
        "readingDate": "2024-01-15T10:00:00Z",
        "notes": "Monthly reading"
      },
      "timestamp": "2024-01-15T10:00:00Z",
      "metadata": {
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": "audit_id_2",
      "userId": "user_id",
      "action": "LOGIN",
      "entityType": "User",
      "entityId": "user_id",
      "oldValues": null,
      "newValues": {
        "email": "john@example.com",
        "loginMethod": "credentials"
      },
      "timestamp": "2024-01-15T09:30:00Z",
      "metadata": {
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Backup and Recovery (Admin Only)

#### GET /api/backup

Create and download system backups.

**Query Parameters:**

- `type`: 'full' | 'users' | 'purchase-data' (default: 'full')
- `includeAuditLogs`: 'true' | 'false' (default: 'false') - Whether to include audit logs in backup

**Response:**

Downloads a JSON file containing the backup data with the following structure:

```json
{
  "metadata": {
    "timestamp": "2024-01-20T10:00:00Z",
    "version": "1.0",
    "type": "full",
    "recordCounts": {
      "users": 15,
      "tokenPurchases": 45,
      "userContributions": 30,
      "meterReadings": 120,
      "auditLogs": 150,
      "accounts": 5,
      "sessions": 10,
      "verificationTokens": 2
    }
  },
  "users": [...],
  "tokenPurchases": [...],
  "userContributions": [...],
  "meterReadings": [...],
  "auditLogs": [...], // Only included if includeAuditLogs=true
  "accounts": [...], // Only in full backups
  "sessions": [...], // Only in full backups
  "verificationTokens": [...] // Only in full backups
}
```

**Backup Types:**
- `full`: All data including authentication tables
- `users`: User data only
- `purchase-data`: Purchases, contributions, and meter readings

**Security Notes:**
- Audit logs are excluded by default due to potentially sensitive information
- Authentication data (accounts, sessions, tokens) only included in full backups
- All backups require admin privileges

#### POST /api/backup

Restore from backup data.

**Request Body:**

Complete backup JSON object as created by GET /api/backup

**Response:**

```json
{
  "message": "Backup restored successfully. Restored tables: users (15), tokenPurchases (45), userContributions (30)",
  "results": {
    "restored": {
      "users": 15,
      "tokenPurchases": 45,
      "userContributions": 30,
      "meterReadings": 120,
      "auditLogs": 150,
      "accounts": 5,
      "sessions": 10,
      "verificationTokens": 2
    },
    "errors": []
  }
}
```

**Restore Features:**
- Automatic constraint validation before restore
- Atomic transaction processing
- Automatic balance recalculation after restore
- Detailed error reporting

#### POST /api/admin/backup/verify

Verify backup integrity.

**Request Body:**

```json
{
  "backupData": {
    /* backup object */
  }
}
```

**Response:**

```json
{
  "isValid": true,
  "errors": [],
  "checksumMatches": {
    "users": true,
    "tokenPurchases": true,
    "userContributions": true,
    "auditLogs": true
  }
}
```

#### POST /api/admin/backup/restore

Restore from backup (DANGEROUS).

**Request Body:**

```json
{
  "backupData": {
    /* backup object */
  },
  "dryRun": true,
  "skipVerification": false
}
```

### Data Export/Import

#### GET /api/export

Export system data in various formats.

**Query Parameters:**

- `format`: 'csv' | 'json'
- `type`: 'purchases' | 'contributions' | 'users' | 'all'
- `startDate`: Start date filter
- `endDate`: End date filter

**Response:**

- CSV file download
- JSON data response

#### POST /api/import

Import data from uploaded files (Admin only).

**Request Body:**

```json
{
  "data": [
    /* array of objects */
  ],
  "type": "purchases",
  "validateOnly": false
}
```

**Response:**

```json
{
  "message": "Import completed successfully",
  "imported": 25,
  "errors": 0,
  "warnings": ["Some warnings if any"]
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error",
    "validationErrors": ["Array of validation errors"]
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data, constraint violations)
- `422` - Unprocessable Entity (business logic errors)
- `500` - Internal Server Error

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ENTRY` - Duplicate data conflict
- `CONSTRAINT_VIOLATION` - Business rule violation
- `CHRONOLOGICAL_ERROR` - Date/sequence validation failed
- `INSUFFICIENT_TOKENS` - Not enough tokens for operation
- `THEME_VALIDATION_ERROR` - Invalid theme preference value
- `METER_READING_ERROR` - Meter reading validation failed
- `AUDIT_LOG_ERROR` - Audit logging operation failed

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Admin endpoints**: 50 requests per minute
- **Export endpoints**: 5 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Security

### Authentication

- JWT-based session tokens
- Secure HTTP-only cookies
- CSRF protection enabled

### Authorization

- Role-based access control (USER, ADMIN)
- Endpoint-specific permission checks
- Resource ownership validation

### Data Protection

- Input sanitization and validation
- SQL injection prevention
- XSS protection
- Secure headers implementation

## Webhooks (Future Enhancement)

Planned webhook endpoints for external integrations:

- Purchase created
- Contribution added
- User registered
- Backup completed

## API Versioning

Current API version: `v1`

Future versions will be accessible via:

```
/api/v2/purchases
```

## Support

For API support and questions:

- Documentation: This document
- Issues: GitHub repository
- Health check: `/api/health`
