import { UserPermissions } from './permissions';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  locked: boolean;
  permissions: UserPermissions | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPurchase {
  id: string;
  totalTokens: number;
  totalPayment: number;
  purchaseDate: Date;
  isEmergency: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  contributions: UserContribution[];
}

export interface UserContribution {
  id: string;
  purchaseId: string;
  userId: string;
  contributionAmount: number;
  meterReading: number;
  tokensConsumed: number;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  purchase: TokenPurchase;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  timestamp: Date;
  user: User;
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalTokensPurchased: number;
  totalAmountPaid: number;
  totalTokensUsed: number;
  averageCostPerKwh: number;
  emergencyPurchases: number;
  tokenLossPercentage: number;
  userBreakdown: UserMonthlyUsage[];
}

export interface UserMonthlyUsage {
  userId: string;
  userName: string;
  tokensUsed: number;
  amountPaid: number;
  trueCost: number;
  efficiency: number;
}
