import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const positiveNumberSchema = z
  .number()
  .positive('Must be a positive number');
export const nonNegativeNumberSchema = z
  .number()
  .min(0, 'Must be non-negative');
export const cuidSchema = z.string().cuid('Invalid ID format');
export const dateSchema = z
  .string()
  .datetime('Invalid date format')
  .or(z.date());

// User validation schemas
export const userRoleSchema = z.enum(['ADMIN', 'USER'], {
  errorMap: () => ({ message: 'Role must be either ADMIN or USER' }),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
});

// User permissions schema for validation
export const userPermissionsSchema = z.object({
  canAddPurchases: z.boolean(),
  canEditPurchases: z.boolean(),
  canDeletePurchases: z.boolean(),
  canAddContributions: z.boolean(),
  canEditContributions: z.boolean(),
  canViewUsageReports: z.boolean(),
  canViewFinancialReports: z.boolean(),
  canViewEfficiencyReports: z.boolean(),
  canViewPersonalDashboard: z.boolean(),
  canViewCostAnalysis: z.boolean(),
  canExportData: z.boolean(),
  canImportData: z.boolean(),
});

// Note: Email is intentionally NOT included in updateUserSchema
// Email addresses cannot be changed for security and identity integrity reasons
// Users must create a new account if they need to use a different email address
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .optional(),
    role: userRoleSchema.optional(),
    locked: z.boolean().optional(),
    permissions: userPermissionsSchema.optional(),
    resetPassword: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const userQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform(Number)
    .refine((n) => n > 0, 'Page must be greater than 0')
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(Number)
    .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .optional(),
  role: userRoleSchema.optional(),
  locked: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
});

// Token Purchase validation schemas
export const createTokenPurchaseSchema = z.object({
  totalTokens: positiveNumberSchema.max(
    100000,
    'Total tokens cannot exceed 100,000'
  ),
  totalPayment: positiveNumberSchema.max(
    1000000,
    'Total payment cannot exceed 1,000,000'
  ),
  meterReading: positiveNumberSchema.max(
    1000000,
    'Initial meter reading cannot exceed 1,000,000'
  ),
  purchaseDate: dateSchema,
  isEmergency: z.boolean().default(false),
});

export const updateTokenPurchaseSchema = z
  .object({
    totalTokens: positiveNumberSchema
      .max(100000, 'Total tokens cannot exceed 100,000')
      .optional(),
    totalPayment: positiveNumberSchema
      .max(1000000, 'Total payment cannot exceed 1,000,000')
      .optional(),
    meterReading: positiveNumberSchema
      .max(1000000, 'Initial meter reading cannot exceed 1,000,000')
      .optional(),
    purchaseDate: dateSchema.optional(),
    isEmergency: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const purchaseQuerySchema = z
  .object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .transform(Number)
      .refine((n) => n > 0, 'Page must be greater than 0')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
      .optional(),
    isEmergency: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    before: z.string().datetime('Invalid before date format').optional(),
    sortBy: z
      .enum(['purchaseDate', 'totalTokens', 'totalPayment', 'creator'])
      .optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
    }
  );

// User Contribution validation schemas
export const createUserContributionSchema = z
  .object({
    purchaseId: cuidSchema,
    userId: cuidSchema, // Always required - will be auto-set to current user
    contributionAmount: nonNegativeNumberSchema.max(
      1000000,
      'Contribution amount cannot exceed 1,000,000'
    ),
    meterReading: nonNegativeNumberSchema.max(
      1000000,
      'Current meter reading cannot exceed 1,000,000'
    ),
    tokensConsumed: nonNegativeNumberSchema.max(
      100000,
      'Electricity consumed cannot exceed 100,000'
    ),
  })
  .refine((data) => data.tokensConsumed <= data.meterReading * 1.1, {
    message:
      'Electricity consumed should not significantly exceed meter reading difference',
    path: ['tokensConsumed'],
  });

export const updateUserContributionSchema = z
  .object({
    contributionAmount: nonNegativeNumberSchema
      .max(1000000, 'Contribution amount cannot exceed 1,000,000')
      .optional(),
    meterReading: nonNegativeNumberSchema
      .max(1000000, 'Current meter reading cannot exceed 1,000,000')
      .optional(),
    tokensConsumed: nonNegativeNumberSchema
      .max(100000, 'Electricity consumed cannot exceed 100,000')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })
  .refine(
    (data) => {
      if (
        data.tokensConsumed !== undefined &&
        data.meterReading !== undefined
      ) {
        return data.tokensConsumed <= data.meterReading * 1.1;
      }
      return true;
    },
    {
      message:
        'Electricity consumed should not significantly exceed meter reading difference',
      path: ['tokensConsumed'],
    }
  );

export const contributionQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform(Number)
    .refine((n) => n > 0, 'Page must be greater than 0')
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(Number)
    .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .optional(),
  purchaseId: cuidSchema.optional(),
  userId: cuidSchema.optional(),
  calculateBalance: z
    .string()
    .regex(/^(true|false)$/, 'calculateBalance must be true or false')
    .transform((val) => val === 'true')
    .optional(),
});

// Reports validation schemas
export const reportTypeSchema = z.enum(
  ['summary', 'user-breakdown', 'monthly-trends', 'efficiency'],
  {
    errorMap: () => ({ message: 'Invalid report type' }),
  }
);

export const reportQuerySchema = z
  .object({
    type: reportTypeSchema,
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    userId: cuidSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
    }
  );

// Audit validation schemas
export const auditActionSchema = z.enum(['CREATE', 'UPDATE', 'DELETE'], {
  errorMap: () => ({ message: 'Invalid audit action' }),
});

export const auditEntityTypeSchema = z.enum(
  ['User', 'TokenPurchase', 'UserContribution'],
  {
    errorMap: () => ({ message: 'Invalid entity type' }),
  }
);

export const auditQuerySchema = z
  .object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .transform(Number)
      .refine((n) => n > 0, 'Page must be greater than 0')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
      .optional(),
    userId: cuidSchema.optional(),
    action: auditActionSchema.optional(),
    entityType: auditEntityTypeSchema.optional(),
    entityId: cuidSchema.optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
    }
  );

// Authentication validation schemas
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = createUserSchema;

// ID parameter validation
export const idParamSchema = z.object({
  id: cuidSchema,
});

// Validation result types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;

export type CreateTokenPurchaseInput = z.infer<
  typeof createTokenPurchaseSchema
>;
export type UpdateTokenPurchaseInput = z.infer<
  typeof updateTokenPurchaseSchema
>;
export type PurchaseQueryInput = z.infer<typeof purchaseQuerySchema>;

export type CreateUserContributionInput = z.infer<
  typeof createUserContributionSchema
>;
export type UpdateUserContributionInput = z.infer<
  typeof updateUserContributionSchema
>;
export type ContributionQueryInput = z.infer<typeof contributionQuerySchema>;

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type AuditQueryInput = z.infer<typeof auditQuerySchema>;

export type SignInInput = z.infer<typeof signInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;

// Receipt Data validation schemas

// Base receipt data schema (without purchaseId) - used during purchase creation
const receiptDataBaseSchema = z.object({
  tokenNumber: z
    .string()
    .min(1, 'Token number cannot be empty')
    .max(100, 'Token number too long')
    .optional()
    .nullable(),
  accountNumber: z
    .string()
    .min(1, 'Account number cannot be empty')
    .max(50, 'Account number too long')
    .optional()
    .nullable(),
  kwhPurchased: positiveNumberSchema.max(
    100000,
    'kWh purchased cannot exceed 100,000'
  ),
  energyCostZWG: nonNegativeNumberSchema.max(
    10000000,
    'Energy cost too large'
  ),
  debtZWG: nonNegativeNumberSchema.max(10000000, 'Debt amount too large'),
  reaZWG: nonNegativeNumberSchema.max(10000000, 'REA amount too large'),
  vatZWG: nonNegativeNumberSchema.max(10000000, 'VAT amount too large'),
  totalAmountZWG: positiveNumberSchema.max(
    10000000,
    'Total amount cannot exceed 10,000,000'
  ),
  tenderedZWG: positiveNumberSchema.max(
    10000000,
    'Tendered amount too large'
  ),
  transactionDateTime: z.union([
    dateSchema, // ISO 8601 format
    z.string().transform((val) => {
      // Parse DD/MM/YY HH:MM:SS format (from Zimbabwe ZESA receipts)
      const match = val.match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
      if (match) {
        const [, day, month, year, hour, minute, second] = match;
        // Assume 20xx for years (2000-2099)
        const fullYear = `20${year}`;
        const isoString = `${fullYear}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
        return isoString;
      }
      // If not DD/MM/YY format, try parsing as regular date string
      return new Date(val).toISOString();
    }),
  ]),
});

// Schema for creating receipt data with purchase (no purchaseId needed)
export const createReceiptDataWithPurchaseSchema = receiptDataBaseSchema;

// Schema for creating standalone receipt data (requires purchaseId)
export const createReceiptDataSchema = receiptDataBaseSchema.extend({
  purchaseId: z.string().min(1, 'Purchase ID is required'),
});

export const updateReceiptDataSchema = z.object({
  tokenNumber: z
    .string()
    .min(1, 'Token number cannot be empty')
    .max(100, 'Token number too long')
    .optional()
    .nullable(),
  accountNumber: z
    .string()
    .min(1, 'Account number cannot be empty')
    .max(50, 'Account number too long')
    .optional()
    .nullable(),
  kwhPurchased: positiveNumberSchema
    .max(100000, 'kWh purchased cannot exceed 100,000')
    .optional(),
  energyCostZWG: nonNegativeNumberSchema
    .max(10000000, 'Energy cost too large')
    .optional(),
  debtZWG: nonNegativeNumberSchema
    .max(10000000, 'Debt amount too large')
    .optional(),
  reaZWG: nonNegativeNumberSchema
    .max(10000000, 'REA amount too large')
    .optional(),
  vatZWG: nonNegativeNumberSchema
    .max(10000000, 'VAT amount too large')
    .optional(),
  totalAmountZWG: positiveNumberSchema
    .max(10000000, 'Total amount cannot exceed 10,000,000')
    .optional(),
  tenderedZWG: positiveNumberSchema
    .max(10000000, 'Tendered amount too large')
    .optional(),
  transactionDateTime: dateSchema.optional(),
});

export const receiptDataQuerySchema = z.object({
  purchaseId: cuidSchema.optional(),
  tokenNumber: z.string().optional(),
});

// Bulk import schema for CSV parsing
export const bulkImportReceiptSchema = z.object({
  receipts: z.array(
    z.object({
      // Receipt data fields
      tokenNumber: z.string().optional(),
      accountNumber: z.string().optional(),
      kwhPurchased: z.number().positive(),
      energyCostZWG: z.number().nonnegative(),
      debtZWG: z.number().nonnegative(),
      reaZWG: z.number().nonnegative(),
      vatZWG: z.number().nonnegative(),
      totalAmountZWG: z.number().positive(),
      tenderedZWG: z.number().positive(),
      transactionDateTime: z.string(), // Will be parsed from dd/mm/yyyy hh:mm:ss
      
      // Optional matching fields
      matchDate: z.string().optional(),
      matchMeterReading: z.number().optional(),
    })
  ),
  validateOnly: z.boolean().default(false),
});

export type CreateReceiptDataInput = z.infer<typeof createReceiptDataSchema>;
export type CreateReceiptDataWithPurchaseInput = z.infer<typeof createReceiptDataWithPurchaseSchema>;
export type UpdateReceiptDataInput = z.infer<typeof updateReceiptDataSchema>;
export type ReceiptDataQueryInput = z.infer<typeof receiptDataQuerySchema>;
export type BulkImportReceiptInput = z.infer<typeof bulkImportReceiptSchema>;
