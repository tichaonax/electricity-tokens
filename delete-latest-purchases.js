"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function findAndDeleteLatestPurchases() {
    try {
        console.log('🔍 Finding purchases by Rachel Hwandaza on 24/11/2025...');
        // Find the user first
        const user = await prisma.user.findFirst({
            where: {
                name: {
                    contains: 'Rachel Hwandaza'
                }
            }
        });
        if (!user) {
            console.log('❌ User Rachel Hwandaza not found');
            return;
        }
        console.log(`👤 Found user: ${user.name} (${user.email})`);
        // Find purchases on the specific date
        const targetDate = new Date('2025-11-24');
        const nextDay = new Date('2025-11-25');
        const purchases = await prisma.tokenPurchase.findMany({
            where: {
                createdBy: user.id,
                createdAt: {
                    gte: targetDate,
                    lt: nextDay
                }
            },
            include: {
                contribution: true,
                receiptData: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        console.log(`📋 Found ${purchases.length} purchases on 24/11/2025`);
        // Filter for the specific amounts and times
        const targetPurchases = purchases.filter(purchase => {
            const time = purchase.createdAt.toTimeString().slice(0, 8); // HH:MM:SS format
            const tokens = purchase.totalTokens;
            const payment = purchase.totalPayment;
            // First purchase: 7:44:48 AM, 331.36 kWh, $51.00
            const isFirstPurchase = time.startsWith('07:44') && tokens === 331.36 && payment === 51.00;
            // Second purchase: 7:50:50 AM, 331.35 kWh, $51.00
            const isSecondPurchase = time.startsWith('07:50') && tokens === 331.35 && payment === 51.00;
            return isFirstPurchase || isSecondPurchase;
        });
        if (targetPurchases.length === 0) {
            console.log('❌ No matching purchases found');
            return;
        }
        console.log(`🎯 Found ${targetPurchases.length} matching purchases to delete:`);
        // Display details and delete each purchase
        for (const purchase of targetPurchases) {
            console.log('\n📋 Purchase details:');
            console.log(`   ID: ${purchase.id}`);
            console.log(`   Time: ${purchase.createdAt.toTimeString().slice(0, 8)}`);
            console.log(`   Tokens: ${purchase.totalTokens} kWh`);
            console.log(`   Payment: $${purchase.totalPayment}`);
            console.log(`   Meter Reading: ${purchase.meterReading}`);
            console.log(`   Has contribution: ${!!purchase.contribution}`);
            console.log(`   Has receipt: ${!!purchase.receiptData}`);
            // Delete in transaction
            await prisma.$transaction(async (tx) => {
                if (purchase.contribution) {
                    console.log('🗑️ Deleting contribution...');
                    await tx.userContribution.delete({
                        where: { id: purchase.contribution.id }
                    });
                    console.log('✅ Contribution deleted');
                }
                if (purchase.receiptData) {
                    console.log('🗑️ Deleting receipt data...');
                    await tx.receiptData.delete({
                        where: { id: purchase.receiptData.id }
                    });
                    console.log('✅ Receipt data deleted');
                }
                console.log('🗑️ Deleting purchase...');
                await tx.tokenPurchase.delete({
                    where: { id: purchase.id }
                });
                console.log('✅ Purchase deleted');
            });
            console.log('🎉 Successfully deleted purchase and associated data');
        }
        // Run balance recalculation after deletion
        console.log('\n🔧 Recalculating account balances...');
        const { fixAllAccountBalances } = await Promise.resolve().then(() => require('../src/lib/balance-fix'));
        await fixAllAccountBalances();
        console.log('✅ Account balances recalculated');
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
findAndDeleteLatestPurchases();
/content>
    < parameter;
name = "filePath" > c;
electricity - app;
electricity - tokens;
delete -latest - purchases.ts;
