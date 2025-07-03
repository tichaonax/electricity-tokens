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
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  locked: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### TokenPurchase
```typescript
{
  id: string
  totalTokens: number
  totalPayment: number
  meterReading: number
  purchaseDate: DateTime
  isEmergency: boolean
  createdById: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### UserContribution
```typescript
{
  id: string
  purchaseId: string
  userId: string
  contributionAmount: number
  meterReading: number
  tokensConsumed: number
  createdAt: DateTime
  updatedAt: DateTime
}
```

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
      "totalPayment": 150.00,
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
        "contributionAmount": 30.00,
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
  "totalPayment": 150.00,
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
    "totalPayment": 150.00,
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
  "totalPayment": 150.00,
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
    "contributionAmount": 30.00,
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
  "totalPayment": 180.00,
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
      "currentAmount": 30.00,
      "newAmount": 35.00,
      "difference": 5.00
    }
  ],
  "summary": {
    "totalAffected": 3,
    "totalDifference": 15.00
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
      "contributionAmount": 30.00,
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
  "contributionAmount": 30.00,
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
    "contributionAmount": 30.00,
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
  "contributionAmount": 35.00,
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
  "locked": false
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
    "totalCost": 450.00,
    "averageCostPerToken": 1.50,
    "emergencyPurchaseImpact": 50.00
  },
  "summary": {
    "totalTokens": 300,
    "totalCost": 450.00,
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
    "totalSpent": 300.00,
    "tokensPerDollar": 2.5,
    "efficiency": "good"
  },
  "paymentTracking": [
    {
      "userId": "user_id",
      "userName": "John Doe",
      "totalContributed": 150.00,
      "expectedContribution": 120.00,
      "balance": 30.00
    }
  ],
  "annualOverview": {
    "totalSpent": 3600.00,
    "totalTokens": 2400,
    "averageRate": 1.50
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
    "extraCostFromEmergencies": 75.00,
    "potentialSavings": 75.00
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
      "amount": 30.00,
      "date": "2024-01-15T10:00:00Z",
      "purchase": {
        "id": "purchase_id",
        "totalTokens": 100
      }
    }
  ],
  "summary": {
    "totalContributions": 450.00,
    "totalTokensConsumed": 300,
    "averageMonthlyUsage": 150,
    "currentBalance": 25.00
  },
  "upcomingRecommendations": [
    "Consider contributing to Purchase #123",
    "Optimize usage during peak hours"
  ]
}
```

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
      "suggestedContribution": 35.00
    }
  ],
  "totalPending": 1,
  "totalSuggestedAmount": 35.00
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

#### GET /api/audit
Get system audit logs (Admin only).

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `userId`: Filter by user
- `action`: Filter by action type
- `entityType`: Filter by entity type
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
      "entityType": "TokenPurchase",
      "entityId": "purchase_id",
      "oldValues": null,
      "newValues": {
        "totalTokens": 100,
        "totalPayment": 150.00
      },
      "timestamp": "2024-01-15T10:00:00Z",
      "user": {
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

#### GET /api/admin/backup
Get backup recommendations and create backups.

**Query Parameters:**
- `type`: 'full' | 'incremental'
- `since`: Date for incremental backup

**Response:**
```json
{
  "recommendation": "Weekly backups recommended",
  "frequency": "weekly",
  "reasoning": "Moderate activity detected",
  "nextBackupDate": "2024-01-27T10:00:00Z"
}
```

#### POST /api/admin/backup
Create a new backup.

**Request Body:**
```json
{
  "type": "full"
}
```

**Response:**
```json
{
  "message": "Backup created successfully",
  "backup": {
    "id": "backup_123456",
    "type": "full",
    "size": 2048576,
    "recordCounts": {
      "users": 15,
      "tokenPurchases": 45,
      "userContributions": 30,
      "auditLogs": 150
    }
  }
}
```

#### POST /api/admin/backup/verify
Verify backup integrity.

**Request Body:**
```json
{
  "backupData": { /* backup object */ }
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
  "backupData": { /* backup object */ },
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
  "data": [/* array of objects */],
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