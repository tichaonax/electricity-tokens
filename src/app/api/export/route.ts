import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import { z } from 'zod';
import { PDFGenerator } from '@/lib/pdf-generator';

const exportQuerySchema = z.object({
  type: z.enum(['purchases', 'contributions', 'users', 'summary']),
  format: z.enum(['csv', 'json', 'pdf']).default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().cuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('Export API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'authenticated' : 'not authenticated');

    // Check authentication
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Validate query parameters
    const validation = await validateRequest(request, {
      query: exportQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query: {
        type: 'purchases' | 'contributions' | 'users' | 'summary';
        format: 'csv' | 'json' | 'pdf';
        startDate?: string;
        endDate?: string;
        userId?: string;
      };
    };

    const { type, format, startDate, endDate, userId } = query;
    console.log('Export params:', { type, format, startDate, endDate, userId });

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    } else if (startDate) {
      dateFilter.gte = new Date(startDate);
    } else if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    let data: Record<string, unknown>[] = [];
    let filename = '';

    switch (type) {
      case 'purchases':
        console.log('Exporting purchases with dateFilter:', dateFilter);
        const purchasesResult = await exportPurchases(dateFilter);
        console.log(
          'Purchases result:',
          purchasesResult.data.length,
          'records'
        );
        data = purchasesResult.data;
        filename = `purchases_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'contributions':
        const contributionsResult = await exportContributions(
          dateFilter,
          userId || permissionCheck.user!.id,
          permissionCheck.user!.role === 'ADMIN'
        );
        data = contributionsResult.data;
        filename = `contributions_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'users':
        if (permissionCheck.user!.role !== 'ADMIN') {
          return NextResponse.json(
            { message: 'Access denied: Admin required' },
            { status: 403 }
          );
        }
        const usersResult = await exportUsers();
        data = usersResult.data;
        filename = `users_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'summary':
        const summaryResult = await exportSummary(
          dateFilter,
          userId,
          permissionCheck.user!.id,
          permissionCheck.user!.role
        );
        data = summaryResult.data;
        filename = `summary_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid export type' },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      try {
        console.log(
          'Generating PDF for type:',
          type,
          'with',
          data.length,
          'records'
        );
        const pdfGenerator = new PDFGenerator();
        let pdfBlob: Blob;

        switch (type) {
          case 'purchases':
            console.log('Generating purchase PDF report');
            pdfBlob = await pdfGenerator.generatePurchaseReport(data);
            break;
          case 'contributions':
            console.log('Generating contribution PDF report');
            pdfBlob = await pdfGenerator.generateContributionReport(data);
            break;
          case 'summary':
            console.log('Generating summary PDF report');
            pdfBlob = await pdfGenerator.generateUserSummaryReport(data);
            break;
          default:
            console.log('Generating generic PDF report');
            pdfBlob = await pdfGenerator.generateUsageSummaryReport({
              title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
              data,
            });
        }

        console.log('PDF blob generated, converting to buffer');
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('PDF buffer created, size:', buffer.length);
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          },
        });
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        return NextResponse.json(
          { message: 'PDF generation failed', error: String(pdfError) },
          { status: 500 }
        );
      }
    } else {
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function exportPurchases(dateFilter: Record<string, unknown>) {
  const whereClause =
    Object.keys(dateFilter).length > 0
      ? {
          purchaseDate: dateFilter,
        }
      : {};

  console.log('exportPurchases whereClause:', whereClause);
  console.log('dateFilter keys:', Object.keys(dateFilter));

  const purchases = await prisma.tokenPurchase.findMany({
    where: whereClause,
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      contributions: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { purchaseDate: 'desc' },
  });

  console.log('Found purchases in exportPurchases:', purchases.length);

  const data = purchases.map((purchase) => {
    const totalContributions = purchase.contributions.reduce(
      (sum, c) => sum + c.contributionAmount,
      0
    );
    const totalTokensConsumed = purchase.contributions.reduce(
      (sum, c) => sum + c.tokensConsumed,
      0
    );

    return {
      id: purchase.id,
      purchaseDate: purchase.purchaseDate.toISOString().split('T')[0],
      totalTokens: purchase.totalTokens,
      totalPayment: purchase.totalPayment,
      costPerToken: purchase.totalPayment / purchase.totalTokens,
      isEmergency: purchase.isEmergency ? 'Yes' : 'No',
      createdBy: purchase.creator.name,
      createdByEmail: purchase.creator.email,
      contributionCount: purchase.contributions.length,
      totalContributions: totalContributions,
      totalTokensConsumed: totalTokensConsumed,
      tokensRemaining: purchase.totalTokens - totalTokensConsumed,
      utilizationRate:
        purchase.totalTokens > 0
          ? ((totalTokensConsumed / purchase.totalTokens) * 100).toFixed(2) +
            '%'
          : '0%',
      createdAt: purchase.createdAt.toISOString(),
    };
  });

  return { data };
}

async function exportContributions(
  dateFilter: Record<string, unknown>,
  targetUserId: string,
  isAdmin: boolean
) {
  const whereClause: Record<string, unknown> = {};

  if (!isAdmin) {
    whereClause.userId = targetUserId;
  } else if (targetUserId) {
    whereClause.userId = targetUserId;
  }

  if (Object.keys(dateFilter).length > 0) {
    whereClause.purchase = {
      purchaseDate: dateFilter,
    };
  }

  const contributions = await prisma.userContribution.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      purchase: {
        select: {
          purchaseDate: true,
          totalTokens: true,
          totalPayment: true,
          isEmergency: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = contributions.map((contribution) => {
    const costPerToken =
      contribution.purchase.totalPayment / contribution.purchase.totalTokens;
    const trueCost = contribution.tokensConsumed * costPerToken;
    const efficiency =
      contribution.contributionAmount > 0
        ? (trueCost / contribution.contributionAmount) * 100
        : 0;
    const overpayment = contribution.contributionAmount - trueCost;

    return {
      id: contribution.id,
      userName: contribution.user.name,
      userEmail: contribution.user.email,
      purchaseDate: contribution.purchase.purchaseDate
        .toISOString()
        .split('T')[0],
      meterReading: contribution.meterReading,
      tokensConsumed: contribution.tokensConsumed,
      contributionAmount: contribution.contributionAmount,
      trueCost: trueCost.toFixed(4),
      efficiency: efficiency.toFixed(2) + '%',
      overpayment: overpayment.toFixed(4),
      costPerToken: costPerToken.toFixed(4),
      isEmergencyPurchase: contribution.purchase.isEmergency ? 'Yes' : 'No',
      contributionDate: contribution.createdAt.toISOString().split('T')[0],
    };
  });

  return { data };
}

async function exportUsers() {
  const users = await prisma.user.findMany({
    include: {
      contributions: {
        include: {
          purchase: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const data = users.map((user) => {
    const totalContributions = user.contributions.reduce(
      (sum, c) => sum + c.contributionAmount,
      0
    );
    const totalTokensConsumed = user.contributions.reduce(
      (sum, c) => sum + c.tokensConsumed,
      0
    );
    const totalTrueCost = user.contributions.reduce((sum, c) => {
      const costPerToken = c.purchase.totalPayment / c.purchase.totalTokens;
      return sum + c.tokensConsumed * costPerToken;
    }, 0);

    const efficiency =
      totalContributions > 0 ? (totalTrueCost / totalContributions) * 100 : 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      locked: user.locked ? 'Yes' : 'No',
      contributionCount: user.contributions.length,
      totalContributions: totalContributions.toFixed(2),
      totalTokensConsumed: totalTokensConsumed.toFixed(2),
      totalTrueCost: totalTrueCost.toFixed(2),
      efficiency: efficiency.toFixed(2) + '%',
      overpayment: (totalContributions - totalTrueCost).toFixed(2),
      joinedDate: user.createdAt.toISOString().split('T')[0],
      lastActive: user.updatedAt.toISOString().split('T')[0],
    };
  });

  return { data };
}

async function exportSummary(
  dateFilter: Record<string, unknown>,
  targetUserId: string | undefined,
  currentUserId: string,
  userRole: string
) {
  const whereClause: Record<string, unknown> = {};

  if (userRole !== 'ADMIN') {
    whereClause.userId = currentUserId;
  } else if (targetUserId) {
    whereClause.userId = targetUserId;
  }

  if (Object.keys(dateFilter).length > 0) {
    whereClause.purchase = {
      purchaseDate: dateFilter,
    };
  }

  const contributions = await prisma.userContribution.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      purchase: {
        select: {
          purchaseDate: true,
          totalTokens: true,
          totalPayment: true,
          isEmergency: true,
        },
      },
    },
  });

  // Group by user
  interface UserSummary {
    userName: string;
    userEmail: string;
    contributionCount: number;
    totalContributions: number;
    totalTokensConsumed: number;
    totalTrueCost: number;
    emergencyContributions: number;
  }

  const userSummaries = contributions.reduce(
    (acc: Record<string, UserSummary>, contribution) => {
      const userId = contribution.userId;

      if (!acc[userId]) {
        acc[userId] = {
          userName: contribution.user.name,
          userEmail: contribution.user.email,
          contributionCount: 0,
          totalContributions: 0,
          totalTokensConsumed: 0,
          totalTrueCost: 0,
          emergencyContributions: 0,
        };
      }

      const costPerToken =
        contribution.purchase.totalPayment / contribution.purchase.totalTokens;
      const trueCost = contribution.tokensConsumed * costPerToken;

      acc[userId].contributionCount += 1;
      acc[userId].totalContributions += contribution.contributionAmount;
      acc[userId].totalTokensConsumed += contribution.tokensConsumed;
      acc[userId].totalTrueCost += trueCost;

      if (contribution.purchase.isEmergency) {
        acc[userId].emergencyContributions += 1;
      }

      return acc;
    },
    {}
  );

  const data = Object.values(userSummaries).map((summary: UserSummary) => {
    const totalContributions = summary.totalContributions;
    const totalTrueCost = summary.totalTrueCost;
    const contributionCount = summary.contributionCount;
    const emergencyContributions = summary.emergencyContributions;
    const totalTokensConsumed = summary.totalTokensConsumed;

    const efficiency =
      totalContributions > 0 ? (totalTrueCost / totalContributions) * 100 : 0;
    const overpayment = totalContributions - totalTrueCost;
    const emergencyRate =
      contributionCount > 0
        ? (emergencyContributions / contributionCount) * 100
        : 0;
    const avgCostPerToken =
      totalTokensConsumed > 0 ? totalTrueCost / totalTokensConsumed : 0;

    return {
      userName: summary.userName,
      userEmail: summary.userEmail,
      contributionCount,
      totalContributions: totalContributions.toFixed(2),
      totalTokensConsumed: totalTokensConsumed.toFixed(2),
      totalTrueCost: totalTrueCost.toFixed(2),
      efficiency: efficiency.toFixed(2) + '%',
      overpayment: overpayment.toFixed(2),
      emergencyContributions,
      emergencyRate: emergencyRate.toFixed(1) + '%',
      avgCostPerToken: avgCostPerToken.toFixed(4),
    };
  });

  return { data };
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}
