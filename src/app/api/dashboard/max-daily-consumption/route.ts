import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, isWeekend, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // Get all meter readings for analysis - sorted by date for consecutive calculations
    const meterReadings = await prisma.meterReading.findMany({
      where: { userId },
      select: {
        reading: true,
        readingDate: true,
      },
      orderBy: { readingDate: 'desc' },
    });

    // Calculate daily consumption from consecutive meter readings
    const dailyConsumption = new Map<string, number>();
    const weekdayConsumption: number[] = [];
    const weekendConsumption: number[] = [];
    
    // Process consecutive meter readings to calculate daily usage
    for (let i = 0; i < meterReadings.length - 1; i++) {
      const currentReading = meterReadings[i];
      const previousReading = meterReadings[i + 1];
      
      // Calculate consumption for the current reading date
      const consumption = currentReading.reading - previousReading.reading;
      
      if (consumption >= 0) { // Only count positive consumption
        const day = startOfDay(currentReading.readingDate).toISOString();
        dailyConsumption.set(day, consumption);

        if (isWeekend(currentReading.readingDate)) {
          weekendConsumption.push(consumption);
        } else {
          weekdayConsumption.push(consumption);
        }
      }
    }

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
        yesterdayConsumption: "Not Available",
        isNewRecord: false,
        percentageAboveAverage: 0,
        consumptionPattern: {
          weekdays: 0,
          weekends: 0,
        },
        recommendation: 'Add meter readings for at least two consecutive days to calculate consumption.',
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
    const totalConsumption = consumptionValues.reduce((sum, amount) => sum + amount, 0);
    const averageDailyConsumption = totalConsumption / consumptionValues.length;

    // Last 7 days average - filter consumption by date
    const last7DaysConsumption = Array.from(dailyConsumption.entries())
      .filter(([date]) => new Date(date) >= last7Days)
      .map(([, amount]) => amount);
    const last7DaysTotal = last7DaysConsumption.reduce((sum, amount) => sum + amount, 0);
    const last7DaysAverage = last7DaysConsumption.length > 0 ? last7DaysTotal / last7DaysConsumption.length : 0;

    // Last 30 days average - filter consumption by date  
    const last30DaysConsumption = Array.from(dailyConsumption.entries())
      .filter(([date]) => new Date(date) >= last30Days)
      .map(([, amount]) => amount);
    const last30DaysTotal = last30DaysConsumption.reduce((sum, amount) => sum + amount, 0);
    const last30DaysAverage = last30DaysConsumption.length > 0 ? last30DaysTotal / last30DaysConsumption.length : 0;

    // Today's and yesterday's consumption from meter readings
    const todayKey = today.toISOString();
    const yesterdayKey = yesterday.toISOString();
    const todayConsumption = dailyConsumption.get(todayKey) || 0;
    const yesterdayConsumption = dailyConsumption.has(yesterdayKey) ? dailyConsumption.get(yesterdayKey)! : "Not Available";

    // Check if it's a new record (within last 30 days)
    const last30DaysConsumptionValues = Array.from(dailyConsumption.entries())
      .filter(([date]) => new Date(date) >= last30Days)
      .map(([, amount]) => amount);
    const last30DaysDailyMax = last30DaysConsumptionValues.length > 0 ? Math.max(...last30DaysConsumptionValues) : 0;
    const isNewRecord = maxDailyAmount === last30DaysDailyMax && maxDailyAmount > averageDailyConsumption * 1.2;

    // Calculate percentage above average
    const percentageAboveAverage = averageDailyConsumption > 0 
      ? ((maxDailyAmount - averageDailyConsumption) / averageDailyConsumption) * 100 
      : 0;

    // Calculate consumption patterns
    const avgWeekdays = weekdayConsumption.length > 0 
      ? weekdayConsumption.reduce((sum, amount) => sum + amount, 0) / weekdayConsumption.length
      : 0;
    const avgWeekends = weekendConsumption.length > 0 
      ? weekendConsumption.reduce((sum, amount) => sum + amount, 0) / weekendConsumption.length
      : 0;

    // Generate recommendation
    let recommendation = '';
    if (yesterdayConsumption === "Not Available") {
      recommendation = 'Add meter readings for consecutive days to track daily consumption patterns.';
    } else if (maxDailyAmount > averageDailyConsumption * 2) {
      recommendation = 'Your maximum daily usage is significantly higher than average. Consider reviewing high-consumption activities on peak days.';
    } else if (todayConsumption > last7DaysAverage * 1.5) {
      recommendation = 'Today\'s consumption is well above your recent average. Monitor usage to avoid exceeding your budget.';
    } else if (avgWeekends > avgWeekdays * 1.3) {
      recommendation = 'Weekend usage tends to be higher. Consider energy-saving strategies during leisure time.';
    } else if (isNewRecord) {
      recommendation = 'New consumption record set! Track what activities contributed to this peak usage.';
    } else {
      recommendation = 'Your consumption patterns look consistent. Keep maintaining good energy usage habits.';
    }

    const response = {
      maxDailyConsumption: {
        amount: maxDailyAmount,
        date: maxDailyDate,
        dayOfWeek: format(new Date(maxDailyDate), 'EEEE'),
      },
      averageDailyConsumption: Math.round(averageDailyConsumption * 100) / 100,
      last7DaysAverage: Math.round(last7DaysAverage * 100) / 100,
      last30DaysAverage: Math.round(last30DaysAverage * 100) / 100,
      todayConsumption,
      yesterdayConsumption,
      isNewRecord,
      percentageAboveAverage: Math.round(percentageAboveAverage * 10) / 10,
      consumptionPattern: {
        weekdays: Math.round(avgWeekdays * 100) / 100,
        weekends: Math.round(avgWeekends * 100) / 100,
      },
      recommendation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching max daily consumption data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consumption data' },
      { status: 500 }
    );
  }
}