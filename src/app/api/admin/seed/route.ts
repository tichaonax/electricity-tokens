import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const prisma = new PrismaClient();

    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // Check if database already has data
      const existingPurchases = await prisma.tokenPurchase.count();
      if (existingPurchases > 0) {
        return NextResponse.json(
          {
            error:
              'Database already contains purchase data. Seeding is only allowed on empty databases for safety.',
          },
          { status: 400 }
        );
      }

      await prisma.$disconnect();

      // Run the seed script
      const seedScriptPath = path.join(process.cwd(), 'prisma', 'seed.js');

      return new Promise((resolve) => {
        const seedProcess = spawn('node', [seedScriptPath], {
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let output = '';
        let errorOutput = '';

        seedProcess.stdout.on('data', (data) => {
          output += data.toString();
          console.log('Seed output:', data.toString());
        });

        seedProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error('Seed error:', data.toString());
        });

        seedProcess.on('close', (code) => {
          if (code === 0) {
            resolve(
              NextResponse.json({
                success: true,
                message: 'Database seeded successfully with test data',
                output: output,
              })
            );
          } else {
            resolve(
              NextResponse.json(
                {
                  error: `Seeding failed with exit code ${code}`,
                  details: errorOutput,
                },
                { status: 500 }
              )
            );
          }
        });

        seedProcess.on('error', (error) => {
          resolve(
            NextResponse.json(
              {
                error: 'Failed to start seeding process',
                details: error.message,
              },
              { status: 500 }
            )
          );
        });
      });
    } catch (dbError) {
      await prisma.$disconnect();
      throw dbError;
    }
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
