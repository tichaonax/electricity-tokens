import { recalculateAllTokensConsumed } from '../src/lib/balance-fix';

async function main() {
  try {
    console.log('Starting tokens consumed recalculation...');
    await recalculateAllTokensConsumed();
    console.log('✅ Recalculation completed successfully!');
  } catch (error) {
    console.error('❌ Recalculation failed:', error);
    process.exit(1);
  }
}

main();