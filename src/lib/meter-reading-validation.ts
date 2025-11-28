import { prisma } from '@/lib/prisma';

export interface MeterReadingValidationResult {
  valid: boolean;
  error?: string;
  suggestedMinimum?: number;
  lastReading?: {
    value: number;
    date: Date;
    type: 'purchase' | 'contribution';
  };
}

/**
 * Validates that a meter reading follows chronological order based on purchase dates
 * @param newReading - The new meter reading to validate
 * @param purchaseDate - The date of the purchase (for chronological ordering)
 * @param type - Whether this is for a purchase or contribution
 * @param excludePurchaseId - Purchase ID to exclude from validation (for updates)
 * @returns Validation result with suggestions
 */
export async function validateMeterReadingChronology(
  newReading: number,
  purchaseDate: Date,
  type: 'purchase' | 'contribution',
  excludePurchaseId?: string
): Promise<MeterReadingValidationResult> {
  try {
    // Find the latest meter reading that occurred on or before the given purchase date
    const lastValidReading = await findLastMeterReading(
      purchaseDate,
      excludePurchaseId
    );

    // If no previous readings exist, any reading is valid
    if (!lastValidReading) {
      return { valid: true };
    }

    // Check if new reading is greater than or equal to the last valid reading
    if (newReading >= lastValidReading.value) {
      return { valid: true, lastReading: lastValidReading };
    }

    // Invalid: meter reading goes backwards
    return {
      valid: false,
      error: `Meter reading cannot decrease. The last reading on ${lastValidReading.date.toLocaleDateString()} was ${lastValidReading.value.toLocaleString()} kWh.`,
      suggestedMinimum: lastValidReading.value,
      lastReading: lastValidReading,
    };
  } catch (error) {
    console.error('Error validating meter reading chronology:', error);
    return {
      valid: false,
      error: 'Unable to validate meter reading. Please try again.',
    };
  }
}

/**
 * Validates meter reading for a contribution against its purchase
 * @param contributionReading - The contribution meter reading
 * @param purchaseId - The ID of the purchase being contributed to
 * @returns Validation result
 */
export async function validateContributionMeterReading(
  contributionReading: number,
  purchaseId: string
): Promise<MeterReadingValidationResult> {
  try {
    // Get the purchase details
    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
      select: {
        meterReading: true,
        purchaseDate: true,
      },
    });

    if (!purchase) {
      return {
        valid: false,
        error: 'Purchase not found.',
      };
    }

    // For contributions, the meter reading should exactly match the purchase meter reading
    // This is the business rule: contribution meter reading = purchase meter reading
    if (contributionReading !== purchase.meterReading) {
      console.log(
        `Validation failed: contribution ${contributionReading} !== purchase ${purchase.meterReading}`
      );
      return {
        valid: false,
        error: `Contribution meter reading must match the purchase meter reading exactly: ${purchase.meterReading.toLocaleString()} kWh. Current: ${contributionReading.toLocaleString()} kWh.`,
        suggestedMinimum: purchase.meterReading,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating contribution meter reading:', error);
    return {
      valid: false,
      error: 'Unable to validate meter reading. Please try again.',
    };
  }
}

/**
 * Finds the last meter reading that occurred on or before the given date
 * @param beforeDate - Find readings on or before this date
 * @param excludePurchaseId - Purchase ID to exclude (for updates)
 * @returns The last valid meter reading or null if none found
 */
async function findLastMeterReading(
  beforeDate: Date,
  excludePurchaseId?: string
): Promise<{
  value: number;
  date: Date;
  type: 'purchase' | 'contribution';
} | null> {
  // Find all purchases on or before the given date (excluding the one being updated)
  const purchases = await prisma.tokenPurchase.findMany({
    where: {
      purchaseDate: { lte: beforeDate },
      ...(excludePurchaseId && { id: { not: excludePurchaseId } }),
    },
    include: {
      contribution: {
        select: {
          meterReading: true,
          createdAt: true,
        },
      },
    },
    orderBy: { purchaseDate: 'desc' },
  });

  let latestReading: {
    value: number;
    date: Date;
    type: 'purchase' | 'contribution';
  } | null = null;

  // Collect all readings from all purchases and contributions
  const allReadings: Array<{
    value: number;
    date: Date;
    type: 'purchase' | 'contribution';
  }> = [];

  for (const purchase of purchases) {
    // Add the purchase reading
    allReadings.push({
      value: purchase.meterReading,
      date: purchase.purchaseDate,
      type: 'purchase',
    });

    // Add contribution reading if it exists
    // Use purchase date, not contribution createdAt (handles restored backups correctly)
    if (purchase.contribution) {
      allReadings.push({
        value: purchase.contribution.meterReading,
        date: purchase.purchaseDate, // Use purchase date, not createdAt
        type: 'contribution',
      });
    }
  }

  // Sort all readings by date (most recent first) and get the latest
  if (allReadings.length > 0) {
    allReadings.sort((a, b) => b.date.getTime() - a.date.getTime());
    latestReading = allReadings[0];
  }

  return latestReading;
}

/**
 * Gets the minimum required meter reading for a new purchase
 * @param purchaseDate - The date of the new purchase
 * @returns Minimum required meter reading
 */
export async function getMinimumMeterReading(
  purchaseDate: Date,
  excludePurchaseId?: string
): Promise<number> {
  const lastReading = await findLastMeterReading(
    purchaseDate,
    excludePurchaseId
  );
  return lastReading ? lastReading.value : 0;
}

/**
 * Gets suggested meter reading with helpful context
 * @param purchaseDate - The date of the new purchase
 * @returns Helpful information for the user
 */
export async function getMeterReadingSuggestion(
  purchaseDate: Date,
  excludePurchaseId?: string
): Promise<{
  minimum: number;
  suggestion?: number;
  context?: string;
}> {
  const lastReading = await findLastMeterReading(
    purchaseDate,
    excludePurchaseId
  );

  if (!lastReading) {
    return {
      minimum: 0,
      suggestion: 5000, // Reasonable starting point
      context:
        'No previous meter readings found. Enter your current meter reading.',
    };
  }

  // Suggest a reasonable increment based on time difference
  const daysDiff = Math.ceil(
    (purchaseDate.getTime() - lastReading.date.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Assume average daily usage of 10-15 kWh
  const avgDailyUsage = 12;
  const suggestedIncrement = Math.max(daysDiff * avgDailyUsage, 10);

  return {
    minimum: lastReading.value,
    suggestion: lastReading.value + suggestedIncrement,
    context: `Last reading was ${lastReading.value.toLocaleString()} kWh on ${lastReading.date.toLocaleDateString()} (${lastReading.type}). Suggested: ~${suggestedIncrement} kWh increase.`,
  };
}
