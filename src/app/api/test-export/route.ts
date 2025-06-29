import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'purchases';
    const format = url.searchParams.get('format') || 'csv';

    console.log('Test export called with:', { type, format });

    // Simple test data
    const testData = [
      { id: '1', name: 'Test Item', value: 100 },
      { id: '2', name: 'Another Item', value: 200 },
    ];

    if (format === 'csv') {
      const csv = 'id,name,value\n1,Test Item,100\n2,Another Item,200';
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="test.csv"`,
        },
      });
    }

    return NextResponse.json({ message: 'Test export working', data: testData });
  } catch (error) {
    console.error('Test export error:', error);
    return NextResponse.json(
      { message: 'Test export failed', error: String(error) },
      { status: 500 }
    );
  }
}