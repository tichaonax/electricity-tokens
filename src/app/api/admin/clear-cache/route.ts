import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 401 }
      );
    }

    // Return cache invalidation headers to force client-side cache clearing
    const response = NextResponse.json({
      message: 'Cache invalidation initiated',
      timestamp: new Date().toISOString(),
      instructions: [
        'Service worker cache will be cleared on next page load',
        'API responses will be fetched fresh',
        'Browser cache headers have been updated'
      ]
    });

    // Set headers to prevent caching and invalidate existing cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Clear-Site-Data', '"cache", "storage"');
    
    // Custom header to trigger client-side cache clearing
    response.headers.set('X-Cache-Invalidate', 'true');
    response.headers.set('X-Timestamp', Date.now().toString());

    return response;

  } catch (error) {
    console.error('❌ Cache clear failed:', error);

    return NextResponse.json(
      { 
        message: 'Cache clear failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}