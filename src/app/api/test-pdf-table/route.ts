import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing PDF with autoTable...');
    
    // Try importing jsPDF and autotable
    const jsPDF = (await import('jspdf')).default;
    await import('jspdf-autotable');
    console.log('jsPDF and autoTable imported successfully');
    
    // Extend type locally
    const doc = new jsPDF() as jsPDF & { 
      autoTable: (options: Record<string, unknown>) => void 
    };
    console.log('jsPDF instance created');
    
    doc.text('Purchase Report Test', 20, 20);
    console.log('Title added');
    
    // Test data
    const tableData = [
      ['Purchase 1', '1000', '$250.00', 'No'],
      ['Purchase 2', '500', '$150.00', 'Yes'],
    ];
    
    // Try using autoTable
    try {
      doc.autoTable({
        head: [['Purchase', 'Tokens', 'Payment', 'Emergency']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      });
      console.log('AutoTable added successfully');
    } catch (tableError) {
      console.error('AutoTable error:', tableError);
      // Fallback to simple text
      doc.text('AutoTable failed, using fallback', 20, 40);
      tableData.forEach((row, index) => {
        doc.text(row.join(' | '), 20, 50 + (index * 10));
      });
    }
    
    // Generate blob
    const pdfBlob = doc.output('blob');
    console.log('PDF blob generated, size:', pdfBlob.size);
    
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-table.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF table test error:', error);
    return NextResponse.json(
      { 
        message: 'PDF table test failed', 
        error: String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      },
      { status: 500 }
    );
  }
}