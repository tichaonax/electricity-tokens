// Simple script to seed test data without needing to login
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('Starting data seed...');

    // Create test users if they don't exist
    const testUsers = [
      { name: 'Alice Johnson', email: 'alice@test.com', role: 'USER' },
      { name: 'Bob Smith', email: 'bob@test.com', role: 'USER' },
      { name: 'Carol Davis', email: 'carol@test.com', role: 'USER' },
      { name: 'David Wilson', email: 'david@test.com', role: 'USER' },
    ];

    const users = [];
    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!existingUser) {
        const user = await prisma.user.create({
          data: userData
        });
        users.push(user);
        console.log(`Created user: ${user.name}`);
      } else {
        users.push(existingUser);
        console.log(`User already exists: ${existingUser.name}`);
      }
    }

    // Create test purchases spanning the last 6 months with chronological meter readings
    const purchases = [];
    const currentDate = new Date();
    
    // Start with a base meter reading from 6 months ago
    let currentMeterReading = 5000; // Starting meter reading
    
    // Collect all purchase dates first to sort them chronologically
    const purchaseSchedule = [];
    
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const baseDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
      
      // Create 2-4 purchases per month
      const purchasesThisMonth = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < purchasesThisMonth; i++) {
        const dayOffset = Math.floor(Math.random() * 28);
        const actualDate = new Date(baseDate);
        actualDate.setDate(actualDate.getDate() + dayOffset);
        
        const isEmergency = Math.random() < 0.3; // 30% chance of emergency
        const baseRate = 0.25; // $0.25 per token base rate
        const emergencyPremium = isEmergency ? 0.15 : 0; // $0.15 premium for emergency
        const costPerToken = baseRate + emergencyPremium + (Math.random() * 0.05 - 0.025); // ±$0.025 variation
        
        const tokens = Math.floor(Math.random() * 800) + 200; // 200-1000 tokens
        const totalPayment = tokens * costPerToken;
        
        purchaseSchedule.push({
          date: actualDate,
          tokens,
          totalPayment: Math.round(totalPayment * 100) / 100,
          costPerToken,
          isEmergency
        });
      }
    }
    
    // Sort purchases chronologically
    purchaseSchedule.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Create purchases with chronologically increasing meter readings
    for (const purchaseData of purchaseSchedule) {
      // Each purchase starts with the current meter reading
      const initialMeterReading = currentMeterReading;
        
      const purchase = await prisma.tokenPurchase.create({
        data: {
          purchaseDate: purchaseData.date,
          totalTokens: purchaseData.tokens,
          totalPayment: purchaseData.totalPayment,
          meterReading: initialMeterReading,
          isEmergency: purchaseData.isEmergency,
          createdBy: users[Math.floor(Math.random() * users.length)].id,
        }
      });
      
      purchases.push(purchase);
      console.log(`Created purchase: ${purchaseData.tokens} tokens for $${purchase.totalPayment} (meter: ${initialMeterReading}) on ${purchaseData.date.toDateString()}`);
      
      // Create ONE user contribution for this purchase (new business rule)
      // 80% of purchases get contributions immediately, 20% remain without contributions
      if (Math.random() < 0.8) {
        const contributingUser = users[Math.floor(Math.random() * users.length)];
        
        // Calculate realistic electricity consumption (always progresses forward)
        const tokensConsumed = Math.floor(Math.random() * (purchaseData.tokens * 0.8)) + Math.floor(purchaseData.tokens * 0.1); // 10% to 90% of available tokens
        const contributionMeterReading = initialMeterReading + tokensConsumed + Math.floor(Math.random() * 20); // Always higher than initial
        
        const contributionAmount = tokensConsumed * purchaseData.costPerToken * (0.9 + Math.random() * 0.2); // ±10% variation in contribution
        
        await prisma.userContribution.create({
          data: {
            userId: contributingUser.id,
            purchaseId: purchase.id,
            contributionAmount: Math.round(contributionAmount * 100) / 100,
            tokensConsumed,
            meterReading: contributionMeterReading,
          }
        });
        
        console.log(`  -> Contribution by ${contributingUser.name}: ${tokensConsumed} kWh consumed, meter reading: ${contributionMeterReading}`);
        
        // Update current meter reading for next purchase (advance by consumption + realistic daily usage)
        currentMeterReading = contributionMeterReading + Math.floor(Math.random() * 50) + 20; // Add 20-70 kWh between purchases
      } else {
        // Even without contributions, advance the meter reading for next purchase (realistic usage)
        currentMeterReading += Math.floor(Math.random() * 100) + 50; // Add 50-150 kWh for realistic progression
      }
    }

    // Get summary of created data
    const totalPurchases = await prisma.tokenPurchase.count();
    const totalContributions = await prisma.userContribution.count();
    const totalUsers = await prisma.user.count();
    const emergencyPurchases = await prisma.tokenPurchase.count({ where: { isEmergency: true } });
    const regularPurchases = await prisma.tokenPurchase.count({ where: { isEmergency: false } });

    console.log('\n=== SEED SUMMARY ===');
    console.log(`Users: ${totalUsers}`);
    console.log(`Purchases: ${totalPurchases}`);
    console.log(`Contributions: ${totalContributions}`);
    console.log(`Emergency purchases: ${emergencyPurchases}`);
    console.log(`Regular purchases: ${regularPurchases}`);
    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();