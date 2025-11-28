import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware for API routes
 */
export interface ValidationMiddlewareOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: Array<{
      field: string;
      message: string;
    }>;
  };
}

/**
 * Validates request data against Zod schemas
 */
export async function validateRequest<T = unknown>(
  request: NextRequest,
  options: ValidationMiddlewareOptions,
  params?: Record<string, string>
): Promise<ValidationResult<T>> {
  try {
    const validatedData: Record<string, unknown> = {};

    // Validate request body
    if (options.body) {
      try {
        const body = await request.json();
        validatedData.body = options.body.parse(body);
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            success: false,
            error: {
              message: 'Invalid request body',
              details: error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
              })),
            },
          };
        }
        return {
          success: false,
          error: {
            message: 'Invalid JSON in request body',
            details: [],
          },
        };
      }
    }

    // Validate query parameters
    if (options.query) {
      try {
        const { searchParams } = new URL(request.url);
        const queryObject = Object.fromEntries(searchParams);
        validatedData.query = options.query.parse(queryObject);
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            success: false,
            error: {
              message: 'Invalid query parameters',
              details: error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
              })),
            },
          };
        }
        throw error;
      }
    }

    // Validate route parameters
    if (options.params && params) {
      try {
        validatedData.params = options.params.parse(params);
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            success: false,
            error: {
              message: 'Invalid route parameters',
              details: error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
              })),
            },
          };
        }
        throw error;
      }
    }

    return {
      success: true,
      data: validatedData as T,
    };
  } catch (error) {
    console.error('Validation middleware error:', error);
    return {
      success: false,
      error: {
        message: 'Internal validation error',
        details: [],
      },
    };
  }
}

/**
 * Creates a standardized validation error response
 */
export function createValidationErrorResponse(result: ValidationResult) {
  if (!result.error) {
    return NextResponse.json(
      { message: 'Unknown validation error' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      message: result.error.message,
      errors: result.error.details,
    },
    { status: 400 }
  );
}

/**
 * Higher-order function to create validated API handlers
 */
export function withValidation<T = unknown>(
  options: ValidationMiddlewareOptions,
  handler: (
    request: NextRequest,
    context: { params?: Record<string, string> },
    validatedData: T
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    request: NextRequest,
    context: { params?: Record<string, string> } = {}
  ) => {
    const validation = await validateRequest<T>(
      request,
      options,
      context.params
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    return handler(request, context, validation.data!);
  };
}

/**
 * Validates that a user has permission to perform an action
 */
export interface PermissionCheck {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireOwnership?: {
    userIdField: string;
    allowAdmin?: boolean;
  };
}

export interface SessionUser {
  id: string;
  role: string;
  permissions?: Record<string, unknown> | null;
  email?: string;
  name?: string;
}

export function checkPermissions(
  session: { user?: SessionUser } | null,
  data: Record<string, unknown>,
  permissions: PermissionCheck
): { success: boolean; error?: string; user?: SessionUser } {
  // Check if authentication is required
  if (permissions.requireAuth && !session?.user) {
    return { success: false, error: 'Authentication required' };
  }

  if (!session?.user) {
    return { success: false, error: 'Invalid session' };
  }

  // Check if admin role is required
  if (permissions.requireAdmin && session?.user?.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' };
  }

  // Check ownership requirements
  if (permissions.requireOwnership && session.user) {
    const { userIdField, allowAdmin = true } = permissions.requireOwnership;
    const resourceUserId = data[userIdField];

    // Allow admin to access any resource if allowAdmin is true
    if (allowAdmin && session.user.role === 'ADMIN') {
      return { success: true, user: session.user };
    }

    // Check if user owns the resource
    if (resourceUserId !== session.user.id) {
      return {
        success: false,
        error: 'Access denied: insufficient permissions',
      };
    }
  }

  return { success: true, user: session.user };
}

/**
 * Business logic validation functions
 */
export interface BusinessRuleCheck {
  checkTokenAvailability?: {
    purchaseId: string;
    requestedTokens: number;
    excludeContributionId?: string;
  };
  checkDuplicateContribution?: {
    purchaseId: string;
    userId: string;
    excludeContributionId?: string;
  };
  checkSequentialPurchaseOrder?: {
    purchaseDate: Date;
    bypassAdmin?: boolean;
  };
  checkMeterReadingMatch?: {
    purchaseId: string;
    contributionMeterReading: number;
  };
}

/**
 * Validates business rules that require database checks
 */
export async function validateBusinessRules(
  rules: BusinessRuleCheck,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any
): Promise<{ success: boolean; error?: string }> {
  // Check token availability
  if (rules.checkTokenAvailability) {
    const { purchaseId, requestedTokens, excludeContributionId } =
      rules.checkTokenAvailability;

    // Get the current purchase to find the previous one
    const currentPurchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
    });

    if (!currentPurchase) {
      return { success: false, error: 'Purchase not found' };
    }

    // Find the previous purchase (the one being consumed from)
    const previousPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        purchaseDate: {
          lt: currentPurchase.purchaseDate,
        },
      },
      include: {
        contribution: true,
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    // If there's no previous purchase, tokens consumed should be 0
    if (!previousPurchase) {
      if (requestedTokens > 0) {
        return {
          success: false,
          error: `No previous purchase found. For the first purchase, tokens consumed should be 0.`,
        };
      }
      return { success: true };
    }

    // Calculate consumed tokens from the previous purchase (handle edit case)
    let consumedTokens = 0;
    if (previousPurchase.contribution) {
      // If we're editing a contribution, exclude it from the calculation
      if (!excludeContributionId || previousPurchase.contribution.id !== excludeContributionId) {
        consumedTokens = previousPurchase.contribution.tokensConsumed;
      }
    }

    // Check if requested tokens would exceed available tokens from previous purchase
    if (consumedTokens + requestedTokens > previousPurchase.totalTokens) {
      return {
        success: false,
        error: `Insufficient tokens available from previous purchase. Requested: ${requestedTokens}, Available: ${previousPurchase.totalTokens - consumedTokens}`,
      };
    }
  }

  // Check for duplicate contributions
  if (rules.checkDuplicateContribution) {
    const { purchaseId, userId, excludeContributionId } =
      rules.checkDuplicateContribution;

    const existingContribution = await prisma.userContribution.findFirst({
      where: {
        purchaseId,
        userId,
        ...(excludeContributionId && { id: { not: excludeContributionId } }),
      },
    });

    if (existingContribution) {
      return {
        success: false,
        error: 'User already has a contribution for this purchase',
      };
    }
  }

  // Check sequential purchase order (no new purchase without previous contribution)
  if (rules.checkSequentialPurchaseOrder) {
    const { purchaseDate, bypassAdmin } = rules.checkSequentialPurchaseOrder;

    // Skip validation if admin bypass is enabled
    if (bypassAdmin) {
      return { success: true };
    }

    // Find the most recent purchase before the new purchase date
    const previousPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        purchaseDate: { lt: purchaseDate },
      },
      include: {
        contribution: true,
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    // If there's a previous purchase without contribution, block the new purchase
    if (previousPurchase && !previousPurchase.contribution) {
      return {
        success: false,
        error: `Cannot create new purchase. Previous purchase from ${previousPurchase.purchaseDate.toLocaleDateString()} requires a contribution first.`,
      };
    }
  }

  // Check meter reading match between contribution and purchase
  if (rules.checkMeterReadingMatch) {
    const { purchaseId, contributionMeterReading } = rules.checkMeterReadingMatch;

    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      return { success: false, error: 'Purchase not found' };
    }

    if (purchase.meterReading !== contributionMeterReading) {
      return {
        success: false,
        error: `Contribution meter reading (${contributionMeterReading}) must match purchase meter reading (${purchase.meterReading})`,
      };
    }
  }

  return { success: true };
}

/**
 * Sanitizes input data to prevent common security issues
 */
export function sanitizeInput(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Basic XSS prevention: remove script tags and dangerous attributes
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (typeof value === 'number') {
      // Ensure numbers are finite
      sanitized[key] = Number.isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      sanitized[key] = Boolean(value);
    } else if (value instanceof Date) {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeInput(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Rate limiting data structure (in-memory for simple implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting function
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remainingRequests?: number; resetTime?: number } {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    entry = undefined;
  }

  if (!entry) {
    entry = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, entry);
    return {
      success: true,
      remainingRequests: limit - 1,
      resetTime: entry.resetTime,
    };
  }

  if (entry.count >= limit) {
    return { success: false, resetTime: entry.resetTime };
  }

  entry.count++;
  return {
    success: true,
    remainingRequests: limit - entry.count,
    resetTime: entry.resetTime,
  };
}
