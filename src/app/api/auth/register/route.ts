import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  sanitizeInput,
  checkRateLimit,
} from '@/lib/validation-middleware';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 registration attempts per 15 minutes per IP
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimit = checkRateLimit(`register:${clientIP}`, 5, 15 * 60 * 1000);

    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, {
      body: registerSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { body } = validation.data as {
      body: { name: string; email: string; password: string };
    };
    const sanitizedData = sanitizeInput(body) as {
      name: string;
      email: string;
      password: string;
    };
    const { name, email, password } = sanitizedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Check if this is the first user (should be admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isFirstUser ? 'ADMIN' : 'USER',
      },
    });

    // Log admin creation for security
    if (isFirstUser) {
      console.log(`🔐 First user created as admin: ${email}`);
    }

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
