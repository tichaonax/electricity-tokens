// API types for better type safety

export interface PurchaseWhereInput {
  isEmergency?: boolean;
  purchaseDate?: {
    gte: Date;
    lte: Date;
  };
}

export interface ContributionWhereInput {
  purchaseId?: string;
  userId?: string;
}

export interface UserWhereInput {
  role?: 'ADMIN' | 'USER';
  locked?: boolean;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    email?: { contains: string; mode: 'insensitive' };
  }>;
}

export interface AuditWhereInput {
  userId?: string;
  action?: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType?: 'User' | 'TokenPurchase' | 'UserContribution';
  entityId?: string;
  timestamp?: {
    gte: Date;
    lte: Date;
  };
}

export interface UpdateData {
  [key: string]: unknown;
}

export interface MonthlyData {
  [monthKey: string]: {
    month: string;
    totalTokens: number;
    totalPayment: number;
    totalContributions: number;
    totalTokensConsumed: number;
    emergencyPurchases: number;
    purchaseCount: number;
  };
}

export interface UserBreakdown {
  [userId: string]: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    totalContributions: number;
    totalTokensConsumed: number;
    totalTrueCost: number;
    contributionCount: number;
    averageEfficiency: number;
  };
}
