import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Seeding database with test data...');

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'USER',
        permissions: {
          canAddPurchases: true,
          canEditPurchases: false,
          canDeletePurchases: false,
          canAddContributions: true,
          canEditContributions: true,
          canDeleteContributions: false,
          canAddMeterReadings: true,
          canViewUsageReports: true,
          canViewFinancialReports: true,
          canViewEfficiencyReports: false,
          canViewPersonalDashboard: true,
          canViewCostAnalysis: true,
          canExportData: false,
          canImportData: false,
        },
      },
    });

    console.log('✅ Created user:', user.email);

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Created admin:', admin.email);

    // Create realistic token purchases from April to July 2025
    const purchases = [];
    const now = new Date();
    
    // Create purchases spread from April to July 1st, 2025
    const purchaseDates = [
      // April 2025
      new Date(2025, 3, 5),   // April 5
      new Date(2025, 3, 18),  // April 18
      new Date(2025, 3, 25),  // April 25
      
      // May 2025  
      new Date(2025, 4, 8),   // May 8
      new Date(2025, 4, 20),  // May 20
      new Date(2025, 4, 28),  // May 28
      
      // June 2025
      new Date(2025, 5, 10),  // June 10
      new Date(2025, 5, 22),  // June 22
      
      // July 2025 - LAST purchase on July 1st
      new Date(2025, 6, 1),   // July 1 (final purchase)
    ];

    for (let i = 0; i < purchaseDates.length; i++) {
      const purchaseDate = purchaseDates[i];
      const isEmergency = i % 4 === 0; // Every 4th purchase is emergency
      const tokens = isEmergency ? 50 : 100;
      const payment = isEmergency ? tokens * 0.35 : tokens * 0.25; // Emergency premium

      const purchase = await prisma.tokenPurchase.create({
        data: {
          totalTokens: tokens,
          totalPayment: payment,
          meterReading: 1000 + (i * 50), // Incrementing meter readings
          purchaseDate: startOfDay(purchaseDate),
          isEmergency,
          createdBy: admin.id,
        },
      });

      purchases.push(purchase);
      console.log(`✅ Created purchase ${i + 1}: ${tokens} tokens for $${payment.toFixed(2)} on ${purchaseDate.toDateString()}`);
    }

    // Create meter readings: historical data + daily readings after July 1st
    const historicalReadingDates = [
      new Date(2025, 3, 1),   // April 1 - start
      new Date(2025, 3, 15),  // April 15
      new Date(2025, 4, 1),   // May 1
      new Date(2025, 4, 15),  // May 15
      new Date(2025, 5, 1),   // June 1
      new Date(2025, 5, 15),  // June 15
      new Date(2025, 6, 1),   // July 1 (last contribution date)
    ];

    let baseReading = 1200;
    
    // Create historical meter readings (April - July 1st)
    for (let i = 0; i < historicalReadingDates.length; i++) {
      const readingDate = historicalReadingDates[i];
      const increment = 15 + Math.floor(Math.random() * 15); // 15-30 kWh increments
      const reading = baseReading + increment;
      baseReading = reading;

      await prisma.meterReading.create({
        data: {
          userId: user.id,
          reading,
          readingDate: startOfDay(readingDate),
          notes: `Historical reading: ${reading} kWh`,
        },
      });
      
      console.log(`✅ Created historical meter reading: ${reading} kWh on ${readingDate.toDateString()}`);
    }

    // Calculate daily consumption rate from historical data
    const totalHistoricalConsumption = baseReading - 1200; // Total consumed from April 1 to July 1
    const daysInHistoricalPeriod = 92; // April 1 to July 1 = ~92 days
    const dailyConsumptionRate = totalHistoricalConsumption / daysInHistoricalPeriod; // kWh per day
    
    console.log(`📊 Historical daily consumption rate: ${dailyConsumptionRate.toFixed(2)} kWh/day`);

    // Create daily meter readings from July 2nd to current date
    const july1Reading = baseReading; // Last historical reading (July 1st)
    let currentReading = july1Reading;
    
    const startDate = new Date(2025, 6, 2); // July 2nd
    const endDate = new Date(); // Today
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Add daily consumption with some variation (±20%)
      const variation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 multiplier
      const dailyConsumption = dailyConsumptionRate * variation;
      currentReading += dailyConsumption;
      
      await prisma.meterReading.create({
        data: {
          userId: user.id,
          reading: Math.round(currentReading * 10) / 10, // Round to 1 decimal
          readingDate: startOfDay(new Date(date)),
          notes: `Daily reading: ${Math.round(currentReading * 10) / 10} kWh`,
        },
      });
      
      console.log(`✅ Created daily meter reading: ${Math.round(currentReading * 10) / 10} kWh on ${date.toDateString()}`);
    }

    console.log('✅ Created chronological meter readings with daily data after July 1st');

    // Create user contributions - LAST contribution on July 1st only
    const contributionDates = [
      // April contributions (within a few days of purchases)
      new Date(2025, 3, 7),   // April 7 (for April 5 purchase)
      new Date(2025, 3, 20),  // April 20 (for April 18 purchase)
      new Date(2025, 3, 27),  // April 27 (for April 25 purchase)
      
      // May contributions
      new Date(2025, 4, 10),  // May 10 (for May 8 purchase)
      new Date(2025, 4, 22),  // May 22 (for May 20 purchase)
      new Date(2025, 4, 30),  // May 30 (for May 28 purchase)
      
      // June contributions  
      new Date(2025, 5, 12),  // June 12 (for June 10 purchase)
      new Date(2025, 5, 24),  // June 24 (for June 22 purchase)
      
      // July contribution - FINAL contribution on July 1st
      new Date(2025, 6, 1),   // July 1 (LAST contribution)
    ];

    // Use realistic meter readings that progress chronologically - last one matches July 1st meter reading
    const contributionMeterReadings = [1230, 1245, 1265, 1280, 1295, 1315, 1335, 1355, july1Reading]; // Last reading matches July 1st

    for (let i = 0; i < purchases.length; i++) {
      const purchase = purchases[i];
      const consumed = 20 + (i * 3); // Varying consumption: 20, 23, 26, 29, etc.
      const contribution = consumed * (purchase.totalPayment / purchase.totalTokens); // Fair share
      const contributionDate = contributionDates[i];
      const meterReading = contributionMeterReadings[i];

      const userContribution = await prisma.userContribution.create({
        data: {
          purchaseId: purchase.id,
          userId: user.id,
          contributionAmount: Math.round(contribution * 100) / 100, // Round to 2 decimals
          meterReading: meterReading,
          tokensConsumed: consumed,
          createdAt: contributionDate,
        },
      });

      console.log(`✅ Created contribution ${i + 1}: ${consumed} kWh for $${contribution.toFixed(2)} on ${contributionDate.toDateString()}, meter: ${meterReading}`);
    }

    console.log('🎉 Database seeded successfully!');
    console.log('📧 Test user: test@example.com / password123');
    console.log('📧 Admin user: admin@example.com / password123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();