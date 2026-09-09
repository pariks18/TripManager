import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  }
}

import { dbStore } from '../lib/dbStore';
import { prisma } from '../lib/prisma';

async function testMultiCompletion() {
  console.log('--- STARTING CHECKLIST MULTI-USER COMPLETION TESTS ---');

  const trips = await prisma.trip.findMany({
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (trips.length === 0) {
    console.error('No trips found in database.');
    process.exit(1);
  }

  const targetTrip = trips.find((t) => t.members.length >= 2) || trips[0];
  const tripId = targetTrip.id;

  if (targetTrip.members.length < 2) {
    console.error('Need at least 2 members on the trip for multi-user completion test.');
    process.exit(1);
  }

  const userA = targetTrip.members[0].userId;
  const userB = targetTrip.members[1].userId;
  const userC = targetTrip.members.length >= 3 ? targetTrip.members[2].userId : null;

  console.log(`Trip: "${targetTrip.name}" (${tripId})`);
  console.log(`User A: ${userA}`);
  console.log(`User B: ${userB}`);
  if (userC) console.log(`User C: ${userC}`);

  let testItemId: string | null = null;

  try {
    // 1. Create a custom group item
    console.log('\n[Step 1] User A creating test group item...');
    const item = await dbStore.addChecklistItem(tripId, userA, {
      type: 'GROUP',
      title: 'Bring First Aid Kit (Multi-Test)',
      category: '🩹 Health',
    });
    testItemId = item.id;
    console.log('✔ Item created:', item.title, 'Initial status:', item.status);

    // 2. User A marks item as DONE
    console.log('\n[Step 2] User A marking item as DONE...');
    const step2 = await dbStore.updateChecklistItem(testItemId, userA, { status: 'DONE' });
    console.log('Status after User A:', step2.status);
    console.log('Completed User IDs:', step2.completedByUserIds);
    console.log('Completed Users:', step2.completedByUsers?.map((u) => u.name));

    if (!step2.completedByUserIds?.includes(userA)) {
      throw new Error('FAILED: User A ID missing from completedByUserIds');
    }

    // 3. User B marks item as DONE
    console.log('\n[Step 3] User B marking item as DONE...');
    const step3 = await dbStore.updateChecklistItem(testItemId, userB, { status: 'DONE' });
    console.log('Status after User B:', step3.status);
    console.log('Completed User IDs:', step3.completedByUserIds);
    console.log('Completed Users:', step3.completedByUsers?.map((u) => u.name));

    if (!step3.completedByUserIds?.includes(userA) || !step3.completedByUserIds?.includes(userB)) {
      throw new Error('FAILED: Both User A and User B should be in completedByUserIds!');
    }

    // 4. User C marks item as DONE (if present)
    if (userC) {
      console.log('\n[Step 4] User C marking item as DONE...');
      const step4 = await dbStore.updateChecklistItem(testItemId, userC, { status: 'DONE' });
      console.log('Completed User IDs:', step4.completedByUserIds);
      if (!step4.completedByUserIds?.includes(userC)) {
        throw new Error('FAILED: User C ID missing from completedByUserIds');
      }
    }

    // 5. User A unchecks the item (sends status PENDING)
    console.log('\n[Step 5] User A unchecking item...');
    const step5 = await dbStore.updateChecklistItem(testItemId, userA, { status: 'PENDING' });
    console.log('Status after User A unchecks:', step5.status);
    console.log('Completed User IDs:', step5.completedByUserIds);
    console.log('Completed Users:', step5.completedByUsers?.map((u) => u.name));

    if (step5.completedByUserIds?.includes(userA)) {
      throw new Error('FAILED: User A should have been removed from completedByUserIds!');
    }
    if (!step5.completedByUserIds?.includes(userB)) {
      throw new Error('FAILED: User B should REMAIN in completedByUserIds!');
    }
    if (step5.status !== 'DONE') {
      throw new Error('FAILED: Item status should still be DONE while User B is completed!');
    }

    // 6. User B unchecks the item
    console.log('\n[Step 6] User B unchecking item...');
    let step6 = await dbStore.updateChecklistItem(testItemId, userB, { status: 'PENDING' });
    if (userC && step6.completedByUserIds?.includes(userC)) {
      step6 = await dbStore.updateChecklistItem(testItemId, userC, { status: 'PENDING' });
    }

    console.log('Final Status after all uncheck:', step6.status);
    console.log('Final Completed User IDs:', step6.completedByUserIds);

    if (step6.status !== 'PENDING') {
      throw new Error('FAILED: Status should be PENDING when no users remain completed!');
    }
    if (step6.completedByUserIds?.length !== 0) {
      throw new Error('FAILED: completedByUserIds should be empty!');
    }

    console.log('\n✔ MULTI-USER COMPLETION TEST PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('❌ TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    if (testItemId) {
      await dbStore.deleteChecklistItem(testItemId, userA).catch(() => {});
    }
  }
}

testMultiCompletion();
