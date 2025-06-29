// Dynamic imports will be used in methods

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

interface ReportData {
  title: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  summary?: Record<string, unknown>;
}

export class PDFGenerator {
  private doc: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  async initializePDF() {
    try {
      const jsPDF = (await import('jspdf')).default;
      await import('jspdf-autotable');
      this.doc = new jsPDF();
      console.log('PDF initialized successfully');
    } catch (error) {
      console.error('Error initializing PDF:', error);
      throw error;
    }
  }

  async generateUsageSummaryReport(data: ReportData): Promise<Blob> {
    if (!this.doc) {
      await this.initializePDF();
    }
    // Add title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.title, 20, 20);

    // Add subtitle if provided
    if (data.subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(data.subtitle, 20, 30);
    }

    // Add generation date
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      20,
      data.subtitle ? 40 : 30
    );

    let yPosition = data.subtitle ? 50 : 40;

    // Add summary section if provided
    if (data.summary) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Summary', 20, yPosition);
      yPosition += 10;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');

      Object.entries(data.summary).forEach(([key, value]) => {
        const formattedKey = this.formatKey(key);
        const formattedValue = this.formatValue(value);
        this.doc.text(`${formattedKey}: ${formattedValue}`, 20, yPosition);
        yPosition += 6;
      });

      yPosition += 10;
    }

    // Add data table
    if (data.data.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Detailed Data', 20, yPosition);
      yPosition += 10;

      // Prepare table data
      const headers = Object.keys(data.data[0]).map((key) =>
        this.formatKey(key)
      );
      const rows = data.data.map((row) =>
        Object.values(row).map((value) => this.formatValue(value))
      );

      // Add table with error handling
      try {
        this.doc.autoTable({
          head: [headers],
          body: rows,
          startY: yPosition,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [59, 130, 246], // Blue color
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252], // Light gray
          },
          columnStyles: {
            // Auto-size columns
          },
          margin: { top: 10, right: 20, bottom: 20, left: 20 },
        });
      } catch (tableError) {
        console.error('AutoTable error:', tableError);
        // Fallback to simple text table
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');

        // Add headers
        const headerText = headers.join(' | ');
        this.doc.text(headerText, 20, yPosition);
        yPosition += 10;

        // Add rows
        rows.forEach((row, index) => {
          const rowText = row.join(' | ');
          this.doc.text(rowText, 20, yPosition + index * 8);
        });
      }
    }

    // Add footer
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.doc.internal.pageSize.width - 40,
        this.doc.internal.pageSize.height - 10
      );
    }

    // Return as blob
    return this.doc.output('blob');
  }

  async generatePurchaseReport(
    purchases: Record<string, unknown>[]
  ): Promise<Blob> {
    const reportData: ReportData = {
      title: 'Token Purchases Report',
      subtitle: 'Comprehensive overview of all token purchases',
      data: purchases,
      summary: this.calculatePurchaseSummary(purchases),
    };

    return await this.generateUsageSummaryReport(reportData);
  }

  async generateContributionReport(
    contributions: Record<string, unknown>[]
  ): Promise<Blob> {
    const reportData: ReportData = {
      title: 'User Contributions Report',
      subtitle: 'Detailed analysis of user contributions and efficiency',
      data: contributions,
      summary: this.calculateContributionSummary(contributions),
    };

    return await this.generateUsageSummaryReport(reportData);
  }

  async generateUserSummaryReport(
    userSummaries: Record<string, unknown>[]
  ): Promise<Blob> {
    const reportData: ReportData = {
      title: 'User Usage Summary Report',
      subtitle: 'Aggregated user statistics and performance metrics',
      data: userSummaries,
      summary: this.calculateUserSummary(userSummaries),
    };

    return await this.generateUsageSummaryReport(reportData);
  }

  private formatKey(key: string): string {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  }

  private calculatePurchaseSummary(
    purchases: Record<string, unknown>[]
  ): Record<string, unknown> {
    if (purchases.length === 0) return {};

    const totalPurchases = purchases.length;
    const totalTokens = purchases.reduce(
      (sum, p) => sum + (Number(p.totalTokens) || 0),
      0
    );
    const totalPayment = purchases.reduce(
      (sum, p) => sum + (Number(p.totalPayment) || 0),
      0
    );
    const emergencyPurchases = purchases.filter(
      (p) => p.isEmergency === 'Yes'
    ).length;
    const averageCostPerToken =
      totalTokens > 0 ? totalPayment / totalTokens : 0;

    return {
      'Total Purchases': totalPurchases,
      'Total Tokens': totalTokens.toLocaleString(),
      'Total Payment': `$${totalPayment.toFixed(2)}`,
      'Emergency Purchases': emergencyPurchases,
      'Average Cost per Token': `$${averageCostPerToken.toFixed(4)}`,
      'Emergency Rate': `${((emergencyPurchases / totalPurchases) * 100).toFixed(1)}%`,
    };
  }

  private calculateContributionSummary(
    contributions: Record<string, unknown>[]
  ): Record<string, unknown> {
    if (contributions.length === 0) return {};

    const totalContributions = contributions.length;
    const totalTokensConsumed = contributions.reduce(
      (sum, c) => sum + (Number(c.tokensConsumed) || 0),
      0
    );
    const totalAmountPaid = contributions.reduce(
      (sum, c) => sum + (Number(c.contributionAmount) || 0),
      0
    );
    const totalTrueCost = contributions.reduce(
      (sum, c) => sum + (Number(c.trueCost) || 0),
      0
    );
    const averageEfficiency =
      totalAmountPaid > 0 ? (totalTrueCost / totalAmountPaid) * 100 : 0;
    const emergencyContributions = contributions.filter(
      (c) => c.isEmergencyPurchase === 'Yes'
    ).length;

    return {
      'Total Contributions': totalContributions,
      'Total Tokens Consumed': totalTokensConsumed.toLocaleString(),
      'Total Amount Paid': `$${totalAmountPaid.toFixed(2)}`,
      'Total True Cost': `$${totalTrueCost.toFixed(2)}`,
      'Average Efficiency': `${averageEfficiency.toFixed(1)}%`,
      'Emergency Contributions': emergencyContributions,
      'Emergency Rate': `${((emergencyContributions / totalContributions) * 100).toFixed(1)}%`,
    };
  }

  private calculateUserSummary(
    userSummaries: Record<string, unknown>[]
  ): Record<string, unknown> {
    if (userSummaries.length === 0) return {};

    const totalUsers = userSummaries.length;
    const totalContributions = userSummaries.reduce(
      (sum, u) => sum + (Number(u.contributionCount) || 0),
      0
    );
    const totalTokensConsumed = userSummaries.reduce((sum, u) => {
      const tokens = String(u.totalTokensConsumed || '0').replace(/,/g, '');
      return sum + (Number(tokens) || 0);
    }, 0);
    const totalAmountPaid = userSummaries.reduce((sum, u) => {
      const amount = String(u.totalContributions || '0').replace(/,/g, '');
      return sum + (Number(amount) || 0);
    }, 0);

    return {
      'Total Users': totalUsers,
      'Total Contributions': totalContributions,
      'Total Tokens Consumed': totalTokensConsumed.toLocaleString(),
      'Total Amount Paid': `$${totalAmountPaid.toFixed(2)}`,
      'Average Contributions per User': (
        totalContributions / totalUsers
      ).toFixed(1),
      'Average Tokens per User': (totalTokensConsumed / totalUsers).toFixed(1),
    };
  }
}
