#!/bin/bash
#
# Pre-Migration Database Backup Script
# For Electricity Tokens - ReceiptData Migration (ET-100)
#
# Usage: ./scripts/backup-before-migration.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-electricity_tokens}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/pre-migration"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Pre-Migration Database Backup${NC}"
echo -e "${GREEN}  ET-100: ReceiptData Migration${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "backups/migrations-backup"

echo -e "${YELLOW}Database:${NC} $DB_NAME"
echo -e "${YELLOW}User:${NC} $DB_USER"
echo -e "${YELLOW}Host:${NC} $DB_HOST"
echo -e "${YELLOW}Timestamp:${NC} $TIMESTAMP"
echo ""

# Step 1: Full database backup
echo -e "${GREEN}[1/5] Creating full database backup...${NC}"
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.dump"

pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom \
  --file="$BACKUP_FILE" \
  --verbose

if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo -e "${GREEN}✓ Full backup completed: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
else
  echo -e "${RED}✗ Backup failed!${NC}"
  exit 1
fi
echo ""

# Step 2: Backup TokenPurchase table (critical data)
echo -e "${GREEN}[2/5] Backing up TokenPurchase table...${NC}"
PURCHASES_FILE="$BACKUP_DIR/token_purchases-$TIMESTAMP.sql"

pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --table=token_purchases \
  --data-only \
  --file="$PURCHASES_FILE"

if [ $? -eq 0 ]; then
  PURCHASES_SIZE=$(du -h "$PURCHASES_FILE" | cut -f1)
  echo -e "${GREEN}✓ TokenPurchase backup completed: $PURCHASES_FILE ($PURCHASES_SIZE)${NC}"
else
  echo -e "${YELLOW}⚠ TokenPurchase backup failed (non-critical)${NC}"
fi
echo ""

# Step 3: Backup migration history
echo -e "${GREEN}[3/5] Backing up Prisma migrations...${NC}"
MIGRATIONS_BACKUP="backups/migrations-backup/migrations-$TIMESTAMP"

if [ -d "prisma/migrations" ]; then
  cp -r prisma/migrations "$MIGRATIONS_BACKUP"
  echo -e "${GREEN}✓ Migrations backed up to: $MIGRATIONS_BACKUP${NC}"
else
  echo -e "${YELLOW}⚠ No migrations directory found${NC}"
fi
echo ""

# Step 4: Save migration status
echo -e "${GREEN}[4/5] Recording migration status...${NC}"
STATUS_FILE="$BACKUP_DIR/migration-status-$TIMESTAMP.txt"

npx prisma migrate status > "$STATUS_FILE" 2>&1 || true

if [ -f "$STATUS_FILE" ]; then
  echo -e "${GREEN}✓ Migration status saved to: $STATUS_FILE${NC}"
fi
echo ""

# Step 5: Save database schema
echo -e "${GREEN}[5/5] Recording database schema...${NC}"
SCHEMA_FILE="$BACKUP_DIR/schema-$TIMESTAMP.sql"

pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --schema-only \
  --file="$SCHEMA_FILE"

if [ $? -eq 0 ]; then
  SCHEMA_SIZE=$(du -h "$SCHEMA_FILE" | cut -f1)
  echo -e "${GREEN}✓ Schema saved to: $SCHEMA_FILE ($SCHEMA_SIZE)${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backup Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}✓ Full backup:${NC} $BACKUP_FILE"
echo -e "${GREEN}✓ TokenPurchase:${NC} $PURCHASES_FILE"
echo -e "${GREEN}✓ Migrations:${NC} $MIGRATIONS_BACKUP"
echo -e "${GREEN}✓ Status:${NC} $STATUS_FILE"
echo -e "${GREEN}✓ Schema:${NC} $SCHEMA_FILE"
echo ""

# Verification
echo -e "${YELLOW}Verifying backup integrity...${NC}"
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  echo -e "${GREEN}✓ Backup file exists and is non-empty${NC}"
  
  # Test backup can be listed (quick integrity check)
  pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup integrity verified${NC}"
  else
    echo -e "${RED}✗ Backup integrity check failed!${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ Backup file is missing or empty!${NC}"
  exit 1
fi
echo ""

# Final instructions
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify backup file: ls -lh $BACKUP_FILE"
echo "2. Review migration status: cat $STATUS_FILE"
echo "3. Proceed with migration: npx prisma migrate deploy"
echo "4. Keep backup safe until migration is verified"
echo ""
echo -e "${YELLOW}Rollback Command (if needed):${NC}"
echo "pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME --clean --if-exists $BACKUP_FILE"
echo ""
echo -e "${GREEN}Backup location: $BACKUP_DIR${NC}"
echo -e "${GREEN}Timestamp: $TIMESTAMP${NC}"
echo ""
