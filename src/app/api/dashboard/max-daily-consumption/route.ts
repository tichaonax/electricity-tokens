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
    
    console.log('Date range debug:', {
      now: now.toISOString(),
      currentMonthStart: currentMonthStart.toISOString(),
      currentMonthEnd: currentMonthEnd.toISOString(),
      today: today.toISOString(),
      yesterday: yesterday.toISOString()
    });
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
    console.log('Raw meter readings:', meterReadings.map(r => ({
      date: r.readingDate.toISOString().split('T')[0],
      reading: r.reading
    })));

    // Calculate daily consumption from consecutive meter readings
    const dailyConsumption = new Map<string, number>();
    const weekdayConsumption: number[] = [];
    const weekendConsumption: number[] = [];

    // Process consecutive meter readings to calculate daily usage (CURRENT MONTH ONLY)
    for (let i = 1; i < meterReadings.length; i++) {
      const currentReading = meterReadings[i];
      const previousReading = meterReadings[i - 1];

      console.log(`Processing reading ${i}: current=${currentReading.reading} on ${currentReading.readingDate.toISOString().split('T')[0]}, previous=${previousReading.reading} on ${previousReading.readingDate.toISOString().split('T')[0]}`);

      // Only include consumption for current month
      if (
        currentReading.readingDate >= currentMonthStart &&
        currentReading.readingDate <= currentMonthEnd
      ) {
        // Calculate consumption between consecutive readings
        const consumption = currentReading.reading - previousReading.reading;
        
        // Calculate the number of days between readings
        const previousDate = startOfDay(previousReading.readingDate);
        const currentDate = startOfDay(currentReading.readingDate);
        const daysDifference = Math.ceil((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`  Consumption calculation: ${currentReading.reading} - ${previousReading.reading} = ${consumption} over ${daysDifference} days`);

        if (consumption >= 0 && daysDifference > 0) {
          // Check if this is a single day or multi-day consumption
          if (daysDifference === 1) {
            // Single day consumption - assign directly
            const currentDateStr = currentReading.readingDate.toISOString().split('T')[0];
            const dayKey = currentDateStr + 'T00:00:00.000Z';
            
            const existingConsumption = dailyConsumption.get(dayKey) || 0;
            dailyConsumption.set(dayKey, existingConsumption + consumption);

            console.log(`  Single day consumption: Added ${consumption} to ${dayKey}, total now: ${dailyConsumption.get(dayKey)}`);

            if (isWeekend(currentReading.readingDate)) {
              weekendConsumption.push(consumption);
            } else {
              weekdayConsumption.push(consumption);
            }
          } else {
            // Multi-day consumption - distribute evenly across days
            const dailyAverage = consumption / daysDifference;
            console.log(`  Multi-day consumption: Distributing ${consumption} over ${daysDifference} days = ${dailyAverage} per day`);
            
            // Distribute consumption across all days in the range
            for (let dayOffset = 1; dayOffset <= daysDifference; dayOffset++) {
              const distributionDate = new Date(previousDate.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
              
              // Only include days within current month
              if (distributionDate >= currentMonthStart && distributionDate <= currentMonthEnd) {
                const dayKey = distributionDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
                
                const existingConsumption = dailyConsumption.get(dayKey) || 0;
                dailyConsumption.set(dayKey, existingConsumption + dailyAverage);

                console.log(`    Distributed ${dailyAverage} to ${dayKey}, total now: ${dailyConsumption.get(dayKey)}`);

                // Add to pattern analysis (using average per day)
                if (isWeekend(distributionDate)) {
                  weekendConsumption.push(dailyAverage);
                } else {
                  weekdayConsumption.push(dailyAverage);
                }
              }
            }
          }
        } else if (consumption < 0) {
          console.log(`  Skipped negative consumption: ${consumption}`);
        } else {
          console.log(`  Skipped zero-day difference`);
        }
      } else {
        console.log(`  Skipped reading outside current month range`);
      }
    }

    console.log(
      'Max Daily Consumption API - Daily consumption entries:',
      dailyConsumption.size
    );
    console.log('Final daily consumption map:', Array.from(dailyConsumption.entries()).map(([date, amount]) => ({
      date: date.split('T')[0],
      consumption: amount
    })));
    console.log('Date ranges:', {
      currentMonthStart: currentMonthStart.toISOString().split('T')[0],
      currentMonthEnd: currentMonthEnd.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
      yesterday: yesterday.toISOString().split('T')[0]
    });

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

    console.log('🔍 Finding maximum daily consumption from entries:');
    for (const [date, amount] of dailyConsumption.entries()) {
      console.log(`  ${date.split('T')[0]}: ${amount} kWh`);
      if (amount > maxDailyAmount) {
        console.log(`    ✅ New maximum: ${amount} kWh on ${date.split('T')[0]} (was ${maxDailyAmount})`);
        maxDailyAmount = amount;
        maxDailyDate = date;
      }
    }

    console.log(`🎯 Final maximum: ${maxDailyAmount} kWh on ${maxDailyDate.split('T')[0]}`);

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
    // FIXED: Use consistent date format matching the consumption map keys
    const todayKey = today.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const yesterdayKey = yesterday.toISOString().split('T')[0] + 'T00:00:00.000Z';
    
    console.log('Looking up consumption with keys:', { todayKey, yesterdayKey });
    console.log('Available keys in map:', Array.from(dailyConsumption.keys()));
    
    const todayConsumption = dailyConsumption.get(todayKey) || 0;
    const yesterdayConsumption = dailyConsumption.has(yesterdayKey)
      ? dailyConsumption.get(yesterdayKey)!
      : 'Not Available';
      
    console.log('Found consumption:', { todayConsumption, yesterdayConsumption });

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

    console.log('📤 Preparing response with maxDailyDate:', maxDailyDate);
    console.log('📤 Converted to Date object:', new Date(maxDailyDate));
    console.log('📤 Formatted day of week:', format(new Date(maxDailyDate), 'EEEE'));

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
