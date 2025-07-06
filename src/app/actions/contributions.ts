'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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
    // Make the API call to delete the contribution
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/contributions/${contributionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete contribution');
    }

    // Revalidate the contributions page to reflect the changes
    revalidatePath('/dashboard/contributions');
    
  } catch (error) {
    // In a real app, you'd want better error handling
    throw new Error(error instanceof Error ? error.message : 'Failed to delete contribution');
  }
}