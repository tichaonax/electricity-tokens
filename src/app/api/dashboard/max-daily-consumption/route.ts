import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  startOfDay,
  subDays,
  isWeekend,
  format,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const last7Days = subDays(now, 7);

    // Get meter readings for current month and a bit before for calculation context
    const contextStart = startOfDay(subDays(currentMonthStart, 1)); // One day before current month for calculation
    const meterReadings = await prisma.meterReading.findMany({
      where: {
        readingDate: {
          gte: contextStart,
          lte: currentMonthEnd,
        },
      },
      select: {
        reading: true,
        readingDate: true,
      },
      orderBy: { readingDate: 'asc' },
    });

    console.log(
      'Max Daily Consumption API - Found meter readings:',
      meterReadings.length
    );

    // Calculate daily consumption from consecutive meter readings
    const dailyConsumption = new Map<string, number>();
    const weekdayConsumption: number[] = [];
    const weekendConsumption: number[] = [];

    // Process consecutive meter readings to calculate daily usage (CURRENT MONTH ONLY)
    for (let i = 1; i < meterReadings.length; i++) {
      const currentReading = meterReadings[i];
      const previousReading = meterReadings[i - 1];

      // Only include consumption for current month
      if (
        currentReading.readingDate >= currentMonthStart &&
        currentReading.readingDate <= currentMonthEnd
      ) {
        // Calculate consumption between consecutive readings
        const consumption = currentReading.reading - previousReading.reading;
        const dayKey = startOfDay(currentReading.readingDate).toISOString();

        if (consumption >= 0) {
          // Only count positive consumption
          // Add to existing daily consumption or set new value
          const existingConsumption = dailyConsumption.get(dayKey) || 0;
          dailyConsumption.set(dayKey, existingConsumption + consumption);

          if (isWeekend(currentReading.readingDate)) {
            weekendConsumption.push(consumption);
          } else {
            weekdayConsumption.push(consumption);
          }
        }
      }
    }

    console.log(
      'Max Daily Consumption API - Daily consumption entries:',
      dailyConsumption.size
    );

    // Check if we have any consumption data
    if (dailyConsumption.size === 0) {
      return NextResponse.json({
        maxDailyConsumption: {
          amount: 0,
          date: today.toISOString(),
          dayOfWeek: format(today, 'EEEE'),
        },
        averageDailyConsumption: 0,
        last7DaysAverage: 0,
        last30DaysAverage: 0,
        todayConsumption: 0,
        yesterdayConsumption: 'Not Available',
        isNewRecord: false,
        percentageAboveAverage: 0,
        consumptionPattern: {
          weekdays: 0,
          weekends: 0,
        },
        recommendation:
          'Add meter readings for the current month to calculate consumption patterns.',
      });
    }

    // Find maximum daily consumption
    let maxDailyAmount = 0;
    let maxDailyDate = today.toISOString();

    for (const [date, amount] of dailyConsumption.entries()) {
      if (amount > maxDailyAmount) {
        maxDailyAmount = amount;
        maxDailyDate = date;
      }
    }

    // Calculate averages from actual consumption data
    const consumptionValues = Array.from(dailyConsumption.values());
    const totalConsumption = consumptionValues.reduce(
      (sum, amount) => sum + amount,
      0
    );
    const averageDailyConsumption = totalConsumption / consumptionValues.length;

    // Last 7 days average (within current month)
    const last7DaysConsumption = Array.from(dailyConsumption.entries())
      .filter(
        ([date]) =>
          new Date(date) >= last7Days && new Date(date) >= currentMonthStart
      )
      .map(([, amount]) => amount);
    const last7DaysTotal = last7DaysConsumption.reduce(
      (sum, amount) => sum + amount,
      0
    );
    const last7DaysAverage =
      last7DaysConsumption.length > 0
        ? last7DaysTotal / last7DaysConsumption.length
        : 0;

    // Current month average (all days in current month with data)
    const currentMonthAverage = averageDailyConsumption; // Since we're only calculating for current month now

    // Today's and yesterday's consumption from meter readings
    const todayKey = today.toISOString();
    const yesterdayKey = yesterday.toISOString();
    const todayConsumption = dailyConsumption.get(todayKey) || 0;
    const yesterdayConsumption = dailyConsumption.has(yesterdayKey)
      ? dailyConsumption.get(yesterdayKey)!
      : 'Not Available';

    // Check if it's a new record (within current month)
    const currentMonthMax =
      consumptionValues.length > 0 ? Math.max(...consumptionValues) : 0;
    const isNewRecord =
      maxDailyAmount === currentMonthMax &&
      maxDailyAmount > averageDailyConsumption * 1.2;

    // Calculate percentage above average
    const percentageAboveAverage =
      averageDailyConsumption > 0
        ? ((maxDailyAmount - averageDailyConsumption) /
            averageDailyConsumption) *
          100
        : 0;

    // Calculate consumption patterns
    const avgWeekdays =
      weekdayConsumption.length > 0
        ? weekdayConsumption.reduce((sum, amount) => sum + amount, 0) /
          weekdayConsumption.length
        : 0;
    const avgWeekends =
      weekendConsumption.length > 0
        ? weekendConsumption.reduce((sum, amount) => sum + amount, 0) /
          weekendConsumption.length
        : 0;

    // Generate recommendation
    let recommendation = '';
    if (yesterdayConsumption === 'Not Available') {
      recommendation =
        'Add meter readings for consecutive days to track daily consumption patterns.';
    } else if (maxDailyAmount > averageDailyConsumption * 2) {
      recommendation =
        'Your maximum daily usage is significantly higher than average. Consider reviewing high-consumption activities on peak days.';
    } else if (todayConsumption > last7DaysAverage * 1.5) {
      recommendation =
        "Today's consumption is well above your recent average. Monitor usage to avoid exceeding your budget.";
    } else if (avgWeekends > avgWeekdays * 1.3) {
      recommendation =
        'Weekend usage tends to be higher. Consider energy-saving strategies during leisure time.';
    } else if (isNewRecord) {
      recommendation =
        'New consumption record set! Track what activities contributed to this peak usage.';
    } else {
      recommendation =
        'Your consumption patterns look consistent. Keep maintaining good energy usage habits.';
    }

    const response = {
      maxDailyConsumption: {
        amount: Math.round(maxDailyAmount * 100) / 100,
        date: maxDailyDate,
        dayOfWeek: format(new Date(maxDailyDate), 'EEEE'),
      },
      averageDailyConsumption: Math.round(averageDailyConsumption * 100) / 100,
      last7DaysAverage: Math.round(last7DaysAverage * 100) / 100,
      last30DaysAverage: Math.round(currentMonthAverage * 100) / 100, // Now shows current month average
      todayConsumption: Math.round(todayConsumption * 100) / 100,
      yesterdayConsumption:
        typeof yesterdayConsumption === 'number'
          ? Math.round(yesterdayConsumption * 100) / 100
          : yesterdayConsumption,
      isNewRecord,
      percentageAboveAverage: Math.round(percentageAboveAverage * 10) / 10,
      consumptionPattern: {
        weekdays: Math.round(avgWeekdays * 100) / 100,
        weekends: Math.round(avgWeekends * 100) / 100,
      },
      recommendation,
    };

    console.log(
      'Max Daily Consumption API - Response:',
      JSON.stringify(response, null, 2)
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching max daily consumption data:', error);

    // Return a more specific error message
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch consumption data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
