'use server';

import { redirect } from 'next/navigation';

export async function signupUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    throw new Error('All fields are required');
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  try {
    // Make the API call to register the user
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    if (response.ok) {
      // Redirect on success
      redirect('/auth/signin?message=Account created successfully');
    } else {
      const data = await response.json();
      throw new Error(data.message || 'Failed to create account');
    }
  } catch (error) {
    // Re-throw the error to be handled by the client
    throw new Error(error instanceof Error ? error.message : 'An error occurred during registration');
  }
}