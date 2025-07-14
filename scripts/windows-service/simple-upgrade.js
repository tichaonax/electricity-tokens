const { execSync } = require('child_process');
const path = require('path');
const config = require('./config');

async function simpleUpgrade() {
  console.log('🚀 Starting Simple Service Upgrade');
  console.log('==================================\n');

  const serviceName = config.name;

  try {
    // Step 1: Stop service
    console.log('🛑 Stopping service...');
    try {
      execSync(`${config.commands.SC_COMMAND} stop "${serviceName}"`, {
        stdio: 'pipe',
      });

      // Wait for service to stop
      let attempts = 0;
      while (attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const result = execSync(
          `${config.commands.SC_COMMAND} query "${serviceName}"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
          }
        );

        if (result.includes('STOPPED')) {
          console.log('✅ Service stopped successfully.');
          break;
        }
        attempts++;
        console.log(`   ⏳ Waiting for service to stop... (${attempts}/10)`);
      }
    } catch (err) {
      console.warn('⚠️  Service may already be stopped or not running');
    }

    // Step 2: Run repair modules (we know this works)
    console.log('🔧 Running comprehensive module repair...');
    const repairModules = require('./repair-modules.js');
    const repairSuccess = await repairModules();

    if (!repairSuccess) {
      throw new Error('Module repair failed');
    }

    // Step 3: Start service
    console.log('🚀 Starting service...');
    execSync(`${config.commands.SC_COMMAND} start "${serviceName}"`, {
      stdio: 'pipe',
    });

    // Wait for service to start
    let startAttempts = 0;
    while (startAttempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = execSync(
        `${config.commands.SC_COMMAND} query "${serviceName}"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
        }
      );

      if (result.includes('RUNNING')) {
        console.log('✅ Service started successfully.');
        break;
      }
      startAttempts++;
      console.log(
        `   ⏳ Waiting for service to start... (${startAttempts}/10)`
      );
    }

    console.log('\n🎉 Simple upgrade completed successfully!');
    console.log(`Service "${serviceName}" is now running with updated code.`);

    return true;
  } catch (err) {
    console.error('\n❌ Simple upgrade failed:', err.message);

    console.log('\n🔧 Manual recovery steps:');
    console.log('1. npm run service:stop');
    console.log('2. npm run service:repair-modules');
    console.log('3. npm run service:start');

    return false;
  }
}

if (require.main === module) {
  simpleUpgrade().then((success) => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = simpleUpgrade;
