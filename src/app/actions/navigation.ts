'use server';

import { redirect } from 'next/navigation';

// Dashboard navigation actions
export async function navigateToDashboard() {
  redirect('/dashboard');
}

export async function navigateToContributions() {
  redirect('/dashboard/contributions');
}

export async function navigateToNewContribution() {
  redirect('/dashboard/contributions/new');
}

export async function navigateToPurchases() {
  redirect('/dashboard/purchases');
}

export async function navigateToNewPurchase() {
  redirect('/dashboard/purchases/new');
}

export async function navigateToPurchaseHistory() {
  redirect('/dashboard/purchases/history');
}

export async function navigateToCostAnalysis() {
  redirect('/dashboard/cost-analysis');
}

export async function navigateToDataManagement() {
  redirect('/dashboard/data-management');
}

export async function navigateToPersonalDashboard() {
  redirect('/dashboard/personal');
}

// Admin navigation actions
export async function navigateToAdmin() {
  redirect('/dashboard/admin');
}

export async function navigateToAdminUsers() {
  redirect('/dashboard/admin/users');
}

export async function navigateToAdminReports() {
  redirect('/dashboard/admin/reports');
}

export async function navigateToAdminAudit() {
  redirect('/dashboard/admin/audit');
}

export async function navigateToAdminSecurity() {
  redirect('/dashboard/admin/security');
}

export async function navigateToUserManagement() {
  redirect('/dashboard/admin/users');
}

export async function navigateToSecurityDashboard() {
  redirect('/dashboard/admin/security');
}

export async function navigateToAuditTrail() {
  redirect('/dashboard/admin/audit');
}

export async function navigateToHelp() {
  redirect('/help');
}

// Reports navigation actions
export async function navigateToUsageReports() {
  redirect('/dashboard/reports/usage');
}

export async function navigateToFinancialReports() {
  redirect('/dashboard/reports/financial');
}

export async function navigateToEfficiencyReports() {
  redirect('/dashboard/reports/efficiency');
}

// Auth navigation actions
export async function navigateToSignIn() {
  redirect('/auth/signin');
}

export async function navigateToSignUp() {
  redirect('/auth/signup');
}

// Dynamic navigation actions
export async function navigateToContributionEdit(formData: FormData) {
  const contributionId = formData.get('contributionId') as string;
  if (contributionId) {
    redirect(`/dashboard/contributions/edit/${contributionId}`);
  }
}

export async function navigateToPurchaseEdit(formData: FormData) {
  const purchaseId = formData.get('purchaseId') as string;
  if (purchaseId) {
    redirect(`/dashboard/purchases/edit/${purchaseId}`);
  }
}