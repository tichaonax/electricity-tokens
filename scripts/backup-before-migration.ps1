# Pre-Migration Database Backup Script (Windows PowerShell)
# For Electricity Tokens - ReceiptData Migration (ET-100)
#
# Usage: .\scripts\backup-before-migration.ps1
#

param(
    [string]$DbName = "electricity_tokens",
    [string]$DbUser = "postgres",
    [string]$DbHost = "localhost"
)

$ErrorActionPreference = "Stop"

# Configuration
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir = "backups\pre-migration"
$MigrationsBackupDir = "backups\migrations-backup"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Pre-Migration Database Backup" -ForegroundColor Green
Write-Host "  ET-100: ReceiptData Migration" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Create backup directories
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}
if (-not (Test-Path $MigrationsBackupDir)) {
    New-Item -ItemType Directory -Path $MigrationsBackupDir -Force | Out-Null
}

Write-Host "Database: $DbName" -ForegroundColor Yellow
Write-Host "User: $DbUser" -ForegroundColor Yellow
Write-Host "Host: $DbHost" -ForegroundColor Yellow
Write-Host "Timestamp: $Timestamp" -ForegroundColor Yellow
Write-Host ""

# Locate pg_dump (common PostgreSQL installation paths)
$PgDumpPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe",
    "C:\PostgreSQL\bin\pg_dump.exe"
)

$PgDump = $null
foreach ($path in $PgDumpPaths) {
    if (Test-Path $path) {
        $PgDump = $path
        break
    }
}

if (-not $PgDump) {
    Write-Host "Error: pg_dump not found. Please install PostgreSQL or set PATH." -ForegroundColor Red
    Write-Host "Searched locations:" -ForegroundColor Yellow
    foreach ($path in $PgDumpPaths) {
        Write-Host "  - $path" -ForegroundColor Yellow
    }
    exit 1
}

$PgRestore = $PgDump -replace "pg_dump", "pg_restore"

Write-Host "Using pg_dump: $PgDump" -ForegroundColor Cyan
Write-Host ""

# Step 1: Full database backup
Write-Host "[1/5] Creating full database backup..." -ForegroundColor Green
$BackupFile = "$BackupDir\backup-$Timestamp.dump"

try {
    & $PgDump -h $DbHost -U $DbUser -d $DbName `
        --format=custom `
        --file=$BackupFile `
        --verbose 2>&1 | Out-Null
    
    $BackupSize = (Get-Item $BackupFile).Length / 1MB
    Write-Host "✓ Full backup completed: $BackupFile ($([math]::Round($BackupSize, 2)) MB)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Backup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Backup TokenPurchase table
Write-Host "[2/5] Backing up TokenPurchase table..." -ForegroundColor Green
$PurchasesFile = "$BackupDir\token_purchases-$Timestamp.sql"

try {
    & $PgDump -h $DbHost -U $DbUser -d $DbName `
        --table=token_purchases `
        --data-only `
        --file=$PurchasesFile 2>&1 | Out-Null
    
    $PurchasesSize = (Get-Item $PurchasesFile).Length / 1KB
    Write-Host "✓ TokenPurchase backup completed: $PurchasesFile ($([math]::Round($PurchasesSize, 2)) KB)" -ForegroundColor Green
}
catch {
    Write-Host "⚠ TokenPurchase backup failed (non-critical): $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Backup migration history
Write-Host "[3/5] Backing up Prisma migrations..." -ForegroundColor Green
$MigrationsBackup = "$MigrationsBackupDir\migrations-$Timestamp"

if (Test-Path "prisma\migrations") {
    try {
        Copy-Item -Path "prisma\migrations" -Destination $MigrationsBackup -Recurse -Force
        Write-Host "✓ Migrations backed up to: $MigrationsBackup" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠ Migrations backup failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠ No migrations directory found" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Save migration status
Write-Host "[4/5] Recording migration status..." -ForegroundColor Green
$StatusFile = "$BackupDir\migration-status-$Timestamp.txt"

try {
    npx prisma migrate status > $StatusFile 2>&1
    Write-Host "✓ Migration status saved to: $StatusFile" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Migration status save failed (non-critical)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Save database schema
Write-Host "[5/5] Recording database schema..." -ForegroundColor Green
$SchemaFile = "$BackupDir\schema-$Timestamp.sql"

try {
    & $PgDump -h $DbHost -U $DbUser -d $DbName `
        --schema-only `
        --file=$SchemaFile 2>&1 | Out-Null
    
    $SchemaSize = (Get-Item $SchemaFile).Length / 1KB
    Write-Host "✓ Schema saved to: $SchemaFile ($([math]::Round($SchemaSize, 2)) KB)" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Schema backup failed (non-critical): $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Backup Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Full backup: $BackupFile" -ForegroundColor Green
Write-Host "✓ TokenPurchase: $PurchasesFile" -ForegroundColor Green
Write-Host "✓ Migrations: $MigrationsBackup" -ForegroundColor Green
Write-Host "✓ Status: $StatusFile" -ForegroundColor Green
Write-Host "✓ Schema: $SchemaFile" -ForegroundColor Green
Write-Host ""

# Verification
Write-Host "Verifying backup integrity..." -ForegroundColor Yellow
if ((Test-Path $BackupFile) -and ((Get-Item $BackupFile).Length -gt 0)) {
    Write-Host "✓ Backup file exists and is non-empty" -ForegroundColor Green
    
    try {
        & $PgRestore --list $BackupFile 2>&1 | Out-Null
        Write-Host "✓ Backup integrity verified" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Backup integrity check failed!" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "✗ Backup file is missing or empty!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Final instructions
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Backup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify backup file: dir $BackupFile"
Write-Host "2. Review migration status: type $StatusFile"
Write-Host "3. Proceed with migration: npx prisma migrate deploy"
Write-Host "4. Keep backup safe until migration is verified"
Write-Host ""
Write-Host "Rollback Command (if needed):" -ForegroundColor Yellow
Write-Host "& `"$PgRestore`" -h $DbHost -U $DbUser -d $DbName --clean --if-exists $BackupFile"
Write-Host ""
Write-Host "Backup location: $BackupDir" -ForegroundColor Green
Write-Host "Timestamp: $Timestamp" -ForegroundColor Green
Write-Host ""
