import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 401 }
      );
    }

    // Create test users if they don't exist
    const testUsers = [
      { name: 'Alice Johnson', email: 'alice@test.com', role: 'USER' as const },
      { name: 'Bob Smith', email: 'bob@test.com', role: 'USER' as const },
      { name: 'Carol Davis', email: 'carol@test.com', role: 'USER' as const },
      { name: 'David Wilson', email: 'david@test.com', role: 'USER' as const },
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
      } else {
        users.push(existingUser);
      }
    }

    // Create test purchases spanning the last 6 months
    const purchases = [];
    const currentDate = new Date();
    
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const purchaseDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
      
      // Create 2-4 purchases per month
      const purchasesThisMonth = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < purchasesThisMonth; i++) {
        const dayOffset = Math.floor(Math.random() * 28);
        const actualDate = new Date(purchaseDate);
        actualDate.setDate(actualDate.getDate() + dayOffset);
        
        const isEmergency = Math.random() < 0.3; // 30% chance of emergency
        const baseRate = 0.25; // $0.25 per token base rate
        const emergencyPremium = isEmergency ? 0.15 : 0; // $0.15 premium for emergency
        const costPerToken = baseRate + emergencyPremium + (Math.random() * 0.05 - 0.025); // ±$0.025 variation
        
        const tokens = Math.floor(Math.random() * 800) + 200; // 200-1000 tokens
        const totalPayment = tokens * costPerToken;
        const initialMeterReading = Math.floor(Math.random() * 5000) + 5000; // Random initial meter reading 5000-10000
        
        const purchase = await prisma.tokenPurchase.create({
          data: {
            purchaseDate: actualDate,
            totalTokens: tokens,
            totalPayment: Math.round(totalPayment * 100) / 100, // Round to 2 decimal places
            meterReading: initialMeterReading, // New field: initial meter reading
            isEmergency,
            createdBy: users[Math.floor(Math.random() * users.length)].id,
          }
        });
        
        purchases.push(purchase);
        
        // Create exactly ONE user contribution for this purchase (one-to-one constraint)
        const contributingUser = users[Math.floor(Math.random() * users.length)];
        
        // Calculate realistic electricity consumption
        const tokensConsumed = Math.floor(Math.random() * (tokens * 0.8)) + Math.floor(tokens * 0.1); // 10% to 90% of available tokens
        const currentMeterReading = initialMeterReading + tokensConsumed + Math.floor(Math.random() * 20); // Slight variance for realism
        
        const contributionAmount = tokensConsumed * costPerToken * (0.9 + Math.random() * 0.2); // ±10% variation in contribution
        
        await prisma.userContribution.create({
          data: {
            userId: contributingUser.id,
            purchaseId: purchase.id,
            contributionAmount: Math.round(contributionAmount * 100) / 100,
            tokensConsumed,
            meterReading: currentMeterReading, // Current meter reading
          }
        });
      }
    }

    // Get summary of created data
    const totalPurchases = await prisma.tokenPurchase.count();
    const totalContributions = await prisma.userContribution.count();
    const totalUsers = await prisma.user.count();

    return NextResponse.json({
      message: 'Test data created successfully',
      summary: {
        users: totalUsers,
        purchases: totalPurchases,
        contributions: totalContributions,
        emergencyPurchases: await prisma.tokenPurchase.count({ where: { isEmergency: true } }),
        regularPurchases: await prisma.tokenPurchase.count({ where: { isEmergency: false } }),
      }
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json(
      { message: 'Failed to create test data', error: String(error) },
      { status: 500 }
    );
  }
}