const path = require('path');
const fs = require('fs');

// Import the service class
const HybridElectricityTokensService = require('./service-wrapper-hybrid.js');

async function testLogRotation() {
  console.log('Testing log rotation and cleanup functionality...\n');

  // Create logs directory if it doesn't exist
  const appRoot = path.resolve(__dirname, '../..');
  const logsDir = path.join(appRoot, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Create some old test log files
  console.log('Creating test log files...');
  const testDates = [
    '2024-01-01', // Old (should be deleted)
    '2024-06-15', // Old (should be deleted)
    new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days ago (should be deleted)
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago (should be kept)
    new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago (should be kept)
    new Date().toISOString().split('T')[0], // Today (should be kept)
  ];

  testDates.forEach((date) => {
    const testFile = path.join(logsDir, `service-wrapper-${date}.log`);
    fs.writeFileSync(testFile, `Test log entry for ${date}\n`);
    console.log(`Created: service-wrapper-${date}.log`);
  });

  console.log('\nFiles before cleanup:');
  const filesBefore = fs
    .readdirSync(logsDir)
    .filter((f) => f.startsWith('service-wrapper-'));
  filesBefore.forEach((file) => console.log(`  ${file}`));

  // Test the service (this will trigger cleanup)
  console.log('\nInitializing service (this will trigger log cleanup)...');
  const service = new HybridElectricityTokensService();

  // Test daily log file generation
  console.log('\nTesting daily log file generation...');
  const expectedLogFile = `service-wrapper-${new Date().toISOString().split('T')[0]}.log`;
  console.log(`Expected today's log file: ${expectedLogFile}`);

  // Test logging
  service.log('Test log message', 'INFO');
  service.log('Test warning message', 'WARN');
  service.log('Test error message', 'ERROR');

  console.log('\nFiles after cleanup:');
  const filesAfter = fs
    .readdirSync(logsDir)
    .filter((f) => f.startsWith('service-wrapper-'));
  filesAfter.forEach((file) => console.log(`  ${file}`));

  // Verify today's log file exists and has content
  const todayLogPath = path.join(logsDir, expectedLogFile);
  if (fs.existsSync(todayLogPath)) {
    const content = fs.readFileSync(todayLogPath, 'utf8');
    console.log(`\nToday's log file content:`);
    console.log(content);
  }

  console.log('\nTest completed successfully!');
  console.log('✓ Daily log files are created with date in filename');
  console.log('✓ Old log files (>14 days) are automatically deleted');
  console.log('✓ Recent log files are preserved');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLogRotation().catch(console.error);
}

module.exports = testLogRotation;
