import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing basic PDF generation...');
    
    // Try importing jsPDF
    const jsPDF = (await import('jspdf')).default;
    console.log('jsPDF imported successfully');
    
    // Try creating a simple PDF
    const doc = new jsPDF();
    console.log('jsPDF instance created');
    
    doc.text('Hello World!', 20, 20);
    doc.text('This is a test PDF', 20, 30);
    doc.text('Generated at: ' + new Date().toISOString(), 20, 40);
    console.log('Text added to PDF');
    
    // Try generating the blob
    const pdfBlob = doc.output('blob');
    console.log('PDF blob generated, size:', pdfBlob.size);
    
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer created, size:', buffer.length);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF test error:', error);
    return NextResponse.json(
      { 
        message: 'PDF test failed', 
        error: String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      },
      { status: 500 }
    );
  }
}