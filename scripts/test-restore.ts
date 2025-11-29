import { readFileSync } from 'fs';
import { join } from 'path';

async function testRestore() {
  try {
    // Read the backup file
    const backupPath = join(process.cwd(), 'et-backup_full_2025-11-27.json');
    const backupData = JSON.parse(readFileSync(backupPath, 'utf-8'));

    console.log('📁 Loaded backup file with metadata:', backupData.metadata);

    // Make the restore request
    const response = await fetch('http://localhost:3000/api/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need to include authentication cookies
        // For testing purposes, this assumes the server is running without auth checks
      },
      body: JSON.stringify(backupData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Restore failed:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Restore completed successfully!');
    console.log('📊 Restore results:', result);

  } catch (error) {
    console.error('❌ Error during restore test:', error);
  }
}

testRestore();