import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const optimizationQueries = [
  {
    name: 'TokenPurchase_purchaseDate_idx',
    sql: `CREATE INDEX IF NOT EXISTS "TokenPurchase_purchaseDate_idx" ON "token_purchases" ("purchaseDate" DESC);`,
  },
  {
    name: 'TokenPurchase_creator_name_idx',
    sql: `CREATE INDEX IF NOT EXISTS "TokenPurchase_creator_name_idx" ON "token_purchases" ("createdBy");`,
  },
  {
    name: 'TokenPurchase_isEmergency_idx',
    sql: `CREATE INDEX IF NOT EXISTS "TokenPurchase_isEmergency_idx" ON "token_purchases" ("isEmergency");`,
  },
  {
    name: 'TokenPurchase_date_range_idx',
    sql: `CREATE INDEX IF NOT EXISTS "TokenPurchase_date_range_idx" ON "token_purchases" ("purchaseDate" DESC, "isEmergency", "createdBy");`,
  },
  {
    name: 'TokenPurchase_tokens_payment_idx',
    sql: `CREATE INDEX IF NOT EXISTS "TokenPurchase_tokens_payment_idx" ON "token_purchases" ("totalTokens", "totalPayment");`,
  },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let indexesCreated = 0;
    const results = [];

    for (const query of optimizationQueries) {
      try {
        await prisma.$executeRawUnsafe(query.sql);
        indexesCreated++;
        results.push({
          name: query.name,
          status: 'success',
          message: 'Index created successfully',
        });
      } catch (error) {
        console.error(`Error creating index ${query.name}:`, error);
        results.push({
          name: query.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log the optimization activity
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DATABASE_OPTIMIZATION',
          entityType: 'SYSTEM',
          entityId: 'database',
          metadata: {
            indexesCreated,
            timestamp: new Date().toISOString(),
            results,
          },
        },
      });
    } catch (auditError) {
      console.error('Error logging database optimization:', auditError);
    }

    return NextResponse.json({
      success: true,
      indexesCreated,
      results,
      message: `Database optimization completed. ${indexesCreated} indexes processed.`,
    });
  } catch (error) {
    console.error('Error in database optimization API:', error);
    return NextResponse.json(
      { error: 'Failed to run database optimization' },
      { status: 500 }
    );
  }
}