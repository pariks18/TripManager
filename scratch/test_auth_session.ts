import { signJWT, verifyJWT } from '../lib/auth';

async function testAuthPersistence() {
  console.log('--- Testing Persistent Auth Session ---');

  const testUser = {
    id: '65f1a2b3c4d5e6f7a8b9c001',
    name: 'Test Explorer',
    email: 'explorer@tripnizer.in',
  };

  // 1. Sign JWT
  const token = await signJWT(testUser);
  console.log('1. Generated JWT Token (30d expiry):', token.substring(0, 30) + '...');

  // 2. Verify JWT
  const verified = await verifyJWT(token);
  console.log('2. Verified Session Payload:', verified);

  if (!verified || verified.id !== testUser.id || verified.email !== testUser.email) {
    throw new Error('FAILED: Session token verification failed!');
  }

  console.log('✓ Persistent JWT Token correctly stores and restores session without password!');
  console.log('==================================================');
  console.log('🎉 AUTH PERSISTENCE VERIFICATION PASSED! 🎉');
  console.log('==================================================');
}

testAuthPersistence().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
