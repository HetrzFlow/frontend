import { beforeAll } from '@jest/globals';

beforeAll(() => {
  console.log('🔧 ...');

  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY ');
    console.log('💡  PRIVATE_KEY :');
    console.log('   export PRIVATE_KEY="your_private_key_here"');
    console.log('    .env : PRIVATE_KEY=your_private_key_here');
    throw new Error('PRIVATE_KEY is required for integration tests');
  }

  console.log('✅ ');
  console.log('🌐 : Sui Testnet');
  console.log('📡 RPC : https:fullnode.testnet.sui.io:443');
  console.log('🔗 API : https:api-testnet.hertzflow.xyz');

  console.log('\n📋 :');
  console.log('-  Sui ');
  console.log('-  SUI ');
  console.log(
    '- : https:docs.sui.io/guides/developer/getting-started/get-coins',
  );
  console.log('-  Gas ');
  console.log('- \n');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌  Promise :', reason);
  console.error('Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('❌ :', error);
  process.exit(1);
});
