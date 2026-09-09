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

async function testChecklistPermissions() {
  console.log('--- STARTING CHECKLIST PERMISSION TESTS ---');

  // Find a trip with at least 2 members (1 creator/admin host, 1 regular member)
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

  // Find a suitable trip
  let targetTrip = trips.find((t) => t.createdById && t.members.length >= 2);
  if (!targetTrip) {
    targetTrip = trips[0];
  }

  const tripId = targetTrip.id;
  const hostUserId = targetTrip.createdById || targetTrip.members.find((m) => m.role === 'ADMIN')?.userId || targetTrip.members[0].userId;

  // Find a regular member (not the host)
  const regularMember = targetTrip.members.find((m) => m.userId !== hostUserId);
  if (!regularMember) {
    console.error('Need at least 2 members on the trip to test member assignment restrictions.');
    process.exit(1);
  }

  const regularMemberUserId = regularMember.userId;

  // Find a 3rd member or fallback to hostUserId for targeting another user
  const thirdMember = targetTrip.members.find((m) => m.userId !== hostUserId && m.userId !== regularMemberUserId);
  const thirdMemberUserId = thirdMember ? thirdMember.userId : hostUserId;

  console.log(`Testing with Trip: "${targetTrip.name}" (${tripId})`);
  console.log(`Host User: ${hostUserId}`);
  console.log(`Regular Member User: ${regularMemberUserId}`);
  console.log(`Target Assignment User: ${thirdMemberUserId}`);

  let createdItemHostId: string | null = null;
  let createdItemMemberId: string | null = null;

  try {
    // Test 1: Host can create group item assigned to another member
    console.log('\n[Test 1] Host creating group item assigned to regular member...');
    const hostItem = await dbStore.addChecklistItem(tripId, hostUserId, {
      type: 'GROUP',
      title: 'Host Test Speaker',
      category: '🍿 Food & Drinks',
      assignedToId: regularMemberUserId,
    });
    createdItemHostId = hostItem.id;
    console.log('✔ SUCCESS: Host created item assigned to member:', hostItem.title, 'assigned to', hostItem.assignedTo?.name);

    // Test 2: Host can reassign item to another member
    console.log('\n[Test 2] Host reassigning group item to another member...');
    const reassignedItem = await dbStore.updateChecklistItem(hostItem.id, hostUserId, {
      assignedToId: thirdMemberUserId,
    });
    console.log('✔ SUCCESS: Host reassigned item to:', reassignedItem.assignedTo?.name);

    // Test 3: Regular member can create unassigned group item
    console.log('\n[Test 3] Regular member creating unassigned group item...');
    const memberItem = await dbStore.addChecklistItem(tripId, regularMemberUserId, {
      type: 'GROUP',
      title: 'Member Test Towel',
      category: '🧻 Hygiene',
      assignedToId: null,
    });
    createdItemMemberId = memberItem.id;
    console.log('✔ SUCCESS: Regular member created unassigned group item:', memberItem.title);

    // Test 4: Regular member ATTEMPTING to create group item assigned to another member (Should Fail)
    console.log('\n[Test 4] Regular member attempting to create group item assigned to another member...');
    try {
      await dbStore.addChecklistItem(tripId, regularMemberUserId, {
        type: 'GROUP',
        title: 'Unauthorized Member Item',
        category: '🍿 Food & Drinks',
        assignedToId: thirdMemberUserId,
      });
      console.error('❌ FAILED: Regular member was able to assign item on creation!');
      process.exit(1);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) {
        console.log('✔ SUCCESS: Backend rejected unauthorized assignment attempt:', err.message);
      } else {
        console.error('❌ FAILED: Unexpected error message:', err.message);
        process.exit(1);
      }
    }

    // Test 5: Regular member ATTEMPTING to reassign an item via updateChecklistItem (Should Fail)
    console.log('\n[Test 5] Regular member attempting to reassign checklist item...');
    try {
      await dbStore.updateChecklistItem(memberItem.id, regularMemberUserId, {
        assignedToId: hostUserId,
      });
      console.error('❌ FAILED: Regular member was able to reassign item!');
      process.exit(1);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) {
        console.log('✔ SUCCESS: Backend rejected unauthorized update attempt:', err.message);
      } else {
        console.error('❌ FAILED: Unexpected error message:', err.message);
        process.exit(1);
      }
    }

    // Test 6: Regular member updating item status (Should Success)
    console.log('\n[Test 6] Regular member updating status of item to DONE...');
    const updatedStatus = await dbStore.updateChecklistItem(memberItem.id, regularMemberUserId, {
      status: 'DONE',
    });
    console.log('✔ SUCCESS: Regular member updated status to DONE:', updatedStatus.status, 'completedBy:', updatedStatus.completedBy?.name);

    console.log('\nALL TEST SCENARIOS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    // Cleanup created test items
    if (createdItemHostId) {
      await dbStore.deleteChecklistItem(createdItemHostId, hostUserId).catch(() => {});
    }
    if (createdItemMemberId) {
      await dbStore.deleteChecklistItem(createdItemMemberId, hostUserId).catch(() => {});
    }
  }
}

testChecklistPermissions();
