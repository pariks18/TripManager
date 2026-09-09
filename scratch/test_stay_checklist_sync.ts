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

async function testStayChecklistSync() {
  console.log('--- STARTING STAY & CHECKLIST SYNC TESTS ---');

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

  const targetTrip = trips.find((t) => t.createdById) || trips[0];
  const tripId = targetTrip.id;
  const adminUserId = targetTrip.createdById || targetTrip.members[0].userId;

  console.log(`Testing with Trip: "${targetTrip.name}" (${tripId})`);
  console.log(`Admin User: ${adminUserId}`);

  let stay1Id: string | null = null;
  let stay2Id: string | null = null;

  try {
    // 1. Create Stay 1 (Puri BnB) with amenities
    console.log('\n[Step 1] Creating Stay 1 (Puri BnB) with Towels, Wi-Fi, Kitchen utensils, Portable speaker...');
    const stay1 = await dbStore.addStayDetail(tripId, adminUserId, {
      name: 'Puri BnB Test Stay',
      address: 'Puri Beach Road',
      availableItems: ['Towels', 'Wi-Fi', 'Kitchen utensils', 'Portable speaker'],
    });
    stay1Id = stay1.id;
    console.log('✔ Created Stay 1:', stay1.name, 'Available items:', stay1.availableItems);

    // 2. Create Stay 2 (Bhubaneswar Hotel) with amenities
    console.log('\n[Step 2] Creating Stay 2 (Bhubaneswar Hotel) with Towels, Bedsheets...');
    const stay2 = await dbStore.addStayDetail(tripId, adminUserId, {
      name: 'Bhubaneswar Hotel Test Stay',
      address: 'Janpath Road',
      availableItems: ['Towels', 'Bedsheets'],
    });
    stay2Id = stay2.id;
    console.log('✔ Created Stay 2:', stay2.name, 'Available items:', stay2.availableItems);

    // 3. Fetch checklist and verify multi-stay availability mapping
    console.log('\n[Step 3] Fetching checklist to verify stay availability badges...');
    const checklist = await dbStore.getTripChecklist(tripId, adminUserId);

    const towelsItem = checklist.groupItems.find((i) => i.title.toLowerCase() === 'towels');
    const utensilsItem = checklist.groupItems.find((i) => i.title.toLowerCase() === 'kitchen utensils');
    const speakerItem = checklist.groupItems.find((i) => i.title.toLowerCase() === 'portable speaker');

    console.log('Towels Stay Availability:', towelsItem?.stayAvailability);
    console.log('Kitchen Utensils Stay Availability:', utensilsItem?.stayAvailability);
    console.log('Portable Speaker Item:', speakerItem ? speakerItem.title : 'Not Found');

    if (!towelsItem) throw new Error('FAILED: Towels checklist item not found');
    if (!utensilsItem) throw new Error('FAILED: Kitchen utensils checklist item not found');
    if (!speakerItem) throw new Error('FAILED: Custom Portable speaker item not auto-synced into checklist!');

    const towelsStay1 = towelsItem.stayAvailability?.find((s) => s.stayId === stay1Id);
    const towelsStay2 = towelsItem.stayAvailability?.find((s) => s.stayId === stay2Id);
    if (!towelsStay1?.isProvided || !towelsStay2?.isProvided) {
      throw new Error('FAILED: Towels should be marked provided at BOTH stays!');
    }

    const utensilsStay1 = utensilsItem.stayAvailability?.find((s) => s.stayId === stay1Id);
    const utensilsStay2 = utensilsItem.stayAvailability?.find((s) => s.stayId === stay2Id);
    if (!utensilsStay1?.isProvided || utensilsStay2?.isProvided) {
      throw new Error('FAILED: Kitchen utensils should be provided at Stay 1 and NOT provided at Stay 2!');
    }

    console.log('✔ Multi-stay availability mapping verified successfully!');

    // 4. Update Stay 1 (Remove Towels)
    console.log('\n[Step 4] Updating Stay 1 (removing Towels from Puri BnB)...');
    await dbStore.updateStayDetail(stay1Id, adminUserId, {
      availableItems: ['Wi-Fi', 'Kitchen utensils', 'Portable speaker'],
    });

    const checklistAfterUpdate = await dbStore.getTripChecklist(tripId, adminUserId);
    const towelsAfterUpdate = checklistAfterUpdate.groupItems.find((i) => i.title.toLowerCase() === 'towels');

    const towelsUpdated1 = towelsAfterUpdate?.stayAvailability?.find((s) => s.stayId === stay1Id);
    const towelsUpdated2 = towelsAfterUpdate?.stayAvailability?.find((s) => s.stayId === stay2Id);

    if (towelsUpdated1?.isProvided || !towelsUpdated2?.isProvided) {
      throw new Error('FAILED: Towels should now be NOT provided at Stay 1, but STILL provided at Stay 2!');
    }
    console.log('✔ Stay update reflection verified successfully!');

    // 5. Delete Stay 1
    console.log('\n[Step 5] Deleting Stay 1 (Puri BnB)...');
    await dbStore.deleteStayDetail(stay1Id, adminUserId);
    stay1Id = null;

    const checklistAfterDelete1 = await dbStore.getTripChecklist(tripId, adminUserId);
    const towelsAfterDelete1 = checklistAfterDelete1.groupItems.find((i) => i.title.toLowerCase() === 'towels');

    if (towelsAfterDelete1?.stayAvailability?.length !== 1 || towelsAfterDelete1.stayAvailability[0].stayId !== stay2Id) {
      throw new Error('FAILED: Checklist should only contain remaining Stay 2 availability after Stay 1 deletion!');
    }
    console.log('✔ Safe stay deletion & checklist cleanup verified!');

    console.log('\n✔ ALL STAY & CHECKLIST SYNC TESTS PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('❌ TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    if (stay1Id) await dbStore.deleteStayDetail(stay1Id, adminUserId).catch(() => {});
    if (stay2Id) await dbStore.deleteStayDetail(stay2Id, adminUserId).catch(() => {});
  }
}

testStayChecklistSync();
