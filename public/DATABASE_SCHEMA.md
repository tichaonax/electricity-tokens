# Electricity Tokens Tracker - Database Schema Documentation

## Overview

This document provides comprehensive documentation for the database schema of the Electricity Tokens Tracker application. The database is designed to track electricity usage through a token-based system where users purchase electricity tokens and contribute their fair share based on actual consumption.

## Database Technology

- **Database**: PostgreSQL 13+
- **ORM**: Prisma 5.x
- **Migrations**: Prisma Migrate
- **Connection Pooling**: Prisma native connection pooling

## Schema Design Principles

1. **Data Integrity**: Strict constraints and foreign key relationships
2. **Audit Trail**: Complete tracking of all data changes
3. **Scalability**: Designed for multi-user households and organizations
4. **Business Logic**: Enforces critical business rules at the database level
5. **Security**: Role-based access with secure authentication

## Core Data Models

### 1. User Model

The `User` model represents system users with role-based access control.

```sql
CREATE TABLE users (
  id                      VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   VARCHAR UNIQUE NOT NULL,
  name                    VARCHAR NOT NULL,
  password                VARCHAR NULL,
  role                    user_role DEFAULT 'USER' NOT NULL,
  locked                  BOOLEAN DEFAULT false NOT NULL,
  password_reset_required BOOLEAN DEFAULT false NOT NULL,
  permissions             JSONB NULL,
  theme_preference        VARCHAR DEFAULT 'system' NULL,
  created_at              TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Fields:**

- `id`: Unique identifier (CUID format)
- `email`: User's email address (unique, used for login)
- `name`: Display name
- `password`: Hashed password (nullable for OAuth users)
- `role`: User role (USER, ADMIN)
- `locked`: Account lock status for security
- `passwordResetRequired`: Forces password reset on next login
- `permissions`: JSON object for fine-grained permissions
- `themePreference`: User's preferred theme ('light', 'dark', 'system')
- `createdAt`: Account creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships:**

- One-to-many with `UserContribution` (contributions made)
- One-to-many with `TokenPurchase` (purchases created)
- One-to-many with `MeterReading` (meter readings recorded)
- One-to-many with `AuditLog` (audit trail)
- One-to-many with `Account` (OAuth accounts)
- One-to-many with `Session` (active sessions)

**Business Rules:**

- Email must be unique across the system
- Admin users have elevated privileges
- Locked users cannot access the system
- Default role is USER for new registrations

---

### 2. TokenPurchase Model

The `TokenPurchase` model represents electricity token purchases with meter readings.

```sql
CREATE TABLE token_purchases (
  id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  total_tokens  DECIMAL(10,2) NOT NULL,
  total_payment DECIMAL(10,2) NOT NULL,
  meter_reading DECIMAL(10,2) NOT NULL,
  purchase_date TIMESTAMP NOT NULL,
  is_emergency  BOOLEAN DEFAULT false NOT NULL,
  created_by    VARCHAR NOT NULL REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Fields:**

- `id`: Unique identifier
- `totalTokens`: Number of electricity tokens purchased (kWh)
- `totalPayment`: Amount paid for the tokens
- `meterReading`: Meter reading at time of purchase
- `purchaseDate`: When the purchase was made
- `isEmergency`: Flag for emergency purchases (higher rate)
- `createdBy`: User who created the purchase
- `createdAt`: Creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships:**

- Many-to-one with `User` (creator)
- One-to-one with `UserContribution` (optional contribution)

**Business Rules:**

- `totalTokens` must be positive (> 0)
- `totalPayment` must be positive (> 0)
- `meterReading` must be positive (> 0)
- Meter readings must be chronologically sequential
- Emergency purchases are flagged for cost analysis
- Only one contribution allowed per purchase

**Constraints:**

- Maximum tokens: 100,000 kWh
- Maximum payment: $1,000,000
- Maximum meter reading: 1,000,000 kWh

---

### 3. UserContribution Model

The `UserContribution` model tracks individual user contributions to token purchases.

```sql
CREATE TABLE user_contributions (
  id                  VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id         VARCHAR UNIQUE NOT NULL REFERENCES token_purchases(id) ON DELETE RESTRICT,
  user_id             VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contribution_amount DECIMAL(10,2) NOT NULL,
  meter_reading       DECIMAL(10,2) NOT NULL,
  tokens_consumed     DECIMAL(10,2) NOT NULL,
  created_at          TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Fields:**

- `id`: Unique identifier
- `purchaseId`: Reference to the token purchase (unique)
- `userId`: User making the contribution
- `contributionAmount`: Amount user is paying
- `meterReading`: Current meter reading when contributing
- `tokensConsumed`: Calculated token usage (current - previous reading)
- `createdAt`: Creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships:**

- One-to-one with `TokenPurchase` (the purchase being contributed to)
- Many-to-one with `User` (contributor)

**Business Rules:**

- One contribution per purchase (enforced by unique constraint)
- Contribution amount must be positive
- Meter reading must be greater than purchase meter reading
- Tokens consumed calculated automatically
- Deletion restricted to prevent data loss

**Key Constraint:**

```sql
CONSTRAINT unique_purchase_contribution
UNIQUE (purchase_id)
```

---

### 4. AuditLog Model

The `AuditLog` model provides complete audit trail for all system changes with enhanced metadata.

```sql
CREATE TABLE audit_logs (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     VARCHAR NOT NULL REFERENCES users(id),
  action      VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id   VARCHAR NOT NULL,
  old_values  JSONB NULL,
  new_values  JSONB NULL,
  timestamp   TIMESTAMP DEFAULT NOW() NOT NULL,
  metadata    JSONB NULL
);
```

**Fields:**

- `id`: Unique identifier
- `userId`: User who performed the action
- `action`: Type of action (CREATE, UPDATE, DELETE, etc.)
- `entityType`: Type of entity modified (User, TokenPurchase, MeterReading, etc.)
- `entityId`: ID of the modified entity
- `oldValues`: Previous values (JSON) - for UPDATE and DELETE actions
- `newValues`: New values (JSON) - for CREATE and UPDATE actions
- `timestamp`: When the action occurred
- `metadata`: Additional context (IP address, user agent, session info, etc.)

**Relationships:**

- Many-to-one with `User` (actor)

**Common Actions:**

- `CREATE`: Entity creation
- `UPDATE`: Entity modification
- `DELETE`: Entity deletion
- `LOGIN`: User authentication
- `LOGIN_FAILED`: Failed login attempts
- `LOGOUT`: User session termination
- `PASSWORD_CHANGE`: Password modifications
- `THEME_CHANGE`: User theme preference updates
- `BACKUP_CREATED`: System backup
- `BACKUP_RESTORE_STARTED`: Restore operation
- `ADMIN_ACTION`: Administrative actions

**Metadata Examples:**

```json
{
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "sess_abc123",
  "reason": "invalid_password",
  "loginMethod": "credentials"
}
```

---

### 5. MeterReading Model

The `MeterReading` model tracks individual meter readings for accurate consumption monitoring.

```sql
CREATE TABLE meter_readings (
  id           VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading      DECIMAL(10,2) NOT NULL,
  reading_date TIMESTAMP NOT NULL,
  notes        TEXT NULL,
  created_at   TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMP DEFAULT NOW() NOT NULL,

  INDEX idx_meter_readings_user_date (user_id, reading_date)
);
```

**Fields:**

- `id`: Unique identifier
- `userId`: User who recorded the reading
- `reading`: Meter reading value (kWh)
- `readingDate`: Date/time of the meter reading
- `notes`: Optional notes about the reading
- `createdAt`: Creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships:**

- Many-to-one with `User` (reader)

**Business Rules:**

- Reading values must be positive
- Reading dates should be chronologically sequential
- Users can record multiple readings per day
- System uses readings to calculate consumption patterns
- Readings support the running balance calculations

**Constraints:**

- Maximum reading: 1,000,000 kWh
- Readings indexed by user and date for efficient queries

---

### 6. Authentication Models

#### Account Model (OAuth)

```sql
CREATE TABLE accounts (
  id                  VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                VARCHAR NOT NULL,
  provider            VARCHAR NOT NULL,
  provider_account_id VARCHAR NOT NULL,
  refresh_token       TEXT NULL,
  access_token        TEXT NULL,
  expires_at          INTEGER NULL,
  token_type          VARCHAR NULL,
  scope               VARCHAR NULL,
  id_token            TEXT NULL,
  session_state       VARCHAR NULL,

  CONSTRAINT unique_provider_account
  UNIQUE (provider, provider_account_id)
);
```

#### Session Model

```sql
CREATE TABLE sessions (
  id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR UNIQUE NOT NULL,
  user_id       VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMP NOT NULL
);
```

#### VerificationToken Model

```sql
CREATE TABLE verification_tokens (
  identifier VARCHAR NOT NULL,
  token      VARCHAR UNIQUE NOT NULL,
  expires    TIMESTAMP NOT NULL,

  CONSTRAINT unique_identifier_token
  UNIQUE (identifier, token)
);
```

## Enums and Types

### Role Enum

```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
```

**Values:**

- `ADMIN`: Full system access, user management, system configuration
- `USER`: Standard user with contribution and viewing permissions

## Indexes

### Performance Indexes

```sql
-- User lookup optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Purchase queries optimization
CREATE INDEX idx_token_purchases_date ON token_purchases(purchase_date);
CREATE INDEX idx_token_purchases_creator ON token_purchases(created_by);
CREATE INDEX idx_token_purchases_emergency ON token_purchases(is_emergency);

-- Contribution queries optimization
CREATE INDEX idx_user_contributions_user ON user_contributions(user_id);
CREATE INDEX idx_user_contributions_purchase ON user_contributions(purchase_id);

-- Audit log queries optimization
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Session management
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires);
```

## Constraints and Business Rules

### Data Integrity Constraints

1. **Foreign Key Constraints:**

```sql
-- User contributions must reference valid purchases and users
ALTER TABLE user_contributions
ADD CONSTRAINT fk_contribution_purchase
FOREIGN KEY (purchase_id) REFERENCES token_purchases(id) ON DELETE RESTRICT;

ALTER TABLE user_contributions
ADD CONSTRAINT fk_contribution_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Purchases must have valid creators
ALTER TABLE token_purchases
ADD CONSTRAINT fk_purchase_creator
FOREIGN KEY (created_by) REFERENCES users(id);
```

2. **Unique Constraints:**

```sql
-- One contribution per purchase
ALTER TABLE user_contributions
ADD CONSTRAINT unique_purchase_contribution
UNIQUE (purchase_id);

-- Unique user emails
ALTER TABLE users
ADD CONSTRAINT unique_user_email
UNIQUE (email);
```

3. **Check Constraints (Application Level):**

- Positive values for tokens, payments, and meter readings
- Chronological meter reading sequence
- Maximum value limits for safety

### Business Logic Rules

1. **Sequential Meter Readings:**
   - Later purchases must have higher meter readings
   - Contributions must have readings ≥ purchase reading
   - Enforced through API validation

2. **One-to-One Purchase-Contribution:**
   - Each purchase can have at most one contribution
   - Enforced by unique constraint on `purchase_id`

3. **Deletion Protection:**
   - Contributions cannot be deleted if purchase exists (`RESTRICT`)
   - Latest purchases cannot be deleted to maintain sequence
   - User deletion cascades to sessions but restricts contributions

4. **Token Calculation:**
   - `tokensConsumed = meterReading - purchaseMeterReading`
   - Automatically calculated and stored

5. **Cost Calculation:**
   - Proportional cost based on actual consumption
   - Emergency purchases tracked for premium analysis

## Migration History

### Initial Schema (v1.0.0)

- Basic user authentication
- Token purchase tracking
- Simple contribution system

### Schema Updates (v1.1.0)

- Added audit logging
- Enhanced user permissions
- Emergency purchase flagging

### Schema Updates (v1.2.0)

- One-to-one purchase-contribution constraint
- Enhanced foreign key relationships
- Improved deletion protection

### Schema Updates (v1.3.0)

- Complete business rule enforcement
- Optimized indexes for performance
- Full audit trail implementation

### Schema Updates (v1.4.0)

- Added user theme preferences (`themePreference` field)
- Enhanced audit logging with metadata support
- Added MeterReading model for better consumption tracking
- Improved mobile responsiveness data architecture
- Comprehensive authentication audit trail

### Current Schema (v1.4.0)

- User-specific theme persistence
- Enhanced audit metadata with IP/UA tracking
- Global meter reading system
- Mobile-first responsive design support
- Comprehensive authentication event logging

## Backup and Recovery

### Backup Strategy

1. **Daily incremental backups** for high-activity periods
2. **Weekly full backups** for normal operations
3. **Monthly archival backups** for long-term retention

### Recovery Procedures

1. **Point-in-time recovery** using PostgreSQL PITR
2. **Application-level restore** via backup API
3. **Data integrity verification** after restore

### Backup Contents

- All user data and contributions
- Complete audit trail
- System configuration
- Checksums for integrity verification

## Performance Considerations

### Query Optimization

- Indexed columns for common queries
- Efficient pagination using cursors
- Materialized views for complex reports

### Connection Management

- Prisma connection pooling
- Connection limits based on deployment
- Health monitoring for database connections

### Data Archival

- Audit log rotation after 2 years
- Soft deletion for historical data
- Archive old purchases while maintaining references

## Security Features

### Data Protection

- Sensitive data encryption at rest
- Secure password hashing (bcrypt)
- SQL injection prevention via Prisma

### Access Control

- Row-level security policies
- Role-based access control
- Session management with secure tokens

### Audit and Compliance

- Complete audit trail for all changes
- Data retention policies
- GDPR compliance features

## Development Guidelines

### Schema Changes

1. Always create migrations via Prisma
2. Test migrations on staging environment
3. Plan for zero-downtime deployments
4. Document all schema changes

### Data Access Patterns

1. Use Prisma client for all database operations
2. Implement proper error handling
3. Use transactions for multi-table operations
4. Monitor query performance

### Testing

1. Unit tests for data validation
2. Integration tests for business rules
3. Performance tests for critical queries
4. Backup/restore testing

## Monitoring and Maintenance

### Health Checks

- Database connection status
- Query performance metrics
- Index usage statistics
- Connection pool utilization

### Regular Maintenance

- Index maintenance and rebuilding
- Statistics updates for query optimization
- Log file rotation and archival
- Performance monitoring and tuning

This schema provides a robust foundation for the Electricity Tokens Tracker application with strong data integrity, comprehensive audit capabilities, and scalable performance characteristics.
