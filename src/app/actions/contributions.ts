'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function editContribution(formData: FormData) {
  const contributionId = formData.get('contributionId') as string;
  if (contributionId) {
    redirect(`/dashboard/contributions/edit/${contributionId}`);
  }
}

export async function deleteContribution(formData: FormData) {
  const contributionId = formData.get('contributionId') as string;
  
  if (!contributionId) {
    throw new Error('Contribution ID is required');
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check if contribution exists
    const existingContribution = await prisma.userContribution.findUnique({
      where: { id: contributionId },
    });

    if (!existingContribution) {
      throw new Error('Contribution not found');
    }

    // Check permissions - only admin can delete contributions
    if (session.user.role !== 'ADMIN') {
      throw new Error('Forbidden: Admin access required');
    }

    // Constraint: Only allow deletion of the globally latest contribution in the system
    const globalLatestContribution = await prisma.userContribution.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!globalLatestContribution || globalLatestContribution.id !== contributionId) {
      throw new Error('Cannot delete contribution: Only the latest contribution in the system may be deleted');
    }

    // Additional constraint: Check if latest token purchase has no contribution
    const latestPurchase = await prisma.tokenPurchase.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { contribution: true },
    });

    if (latestPurchase && !latestPurchase.contribution) {
      throw new Error('Cannot delete contribution: Latest token purchase has no contribution. Deleting this contribution would leave two purchases without contributions.');
    }

    // Delete the contribution
    await prisma.userContribution.delete({
      where: { id: contributionId },
    });

    // Create audit log entry
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'UserContribution',
      entityId: contributionId,
      oldValues: existingContribution,
    });

    // Revalidate the contributions page to reflect the changes
    revalidatePath('/dashboard/contributions');
    
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete contribution');
  }
}