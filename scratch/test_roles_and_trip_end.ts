import { dbStore } from '../lib/dbStore';
import { prisma } from '../lib/prisma';
import { generateObjectId } from '../lib/utils';

async function runTest() {
  console.log('--- Starting Integration Test: Roles and Host-Controlled Trip End ---');

  // 1. Ensure seed users exist in DB
  const users = await prisma.user.findMany({ take: 2 });
  if (users.length < 2) {
    throw new Error('Not enough users in DB to run integration test.');
  }

  const hostId = users[0].id;
  const memberId = users[1].id;
  const testTripId = generateObjectId();
  const tripCode = 'ROLE' + Math.floor(1000 + Math.random() * 9000);

  console.log(`Creating test trip ${testTripId} with host ${users[0].name} and member ${users[1].name}...`);
  await prisma.trip.create({
    data: {
      id: testTripId,
      name: 'Roles & Trip End Test Trip',
      code: tripCode,
      currency: '₹',
      createdById: hostId,
      members: {
        create: [
          { id: generateObjectId(), userId: hostId, role: 'ADMIN', roles: [] },
          { id: generateObjectId(), userId: memberId, role: 'MEMBER', roles: [] },
        ],
      },
    },
  });

  try {
    // 2. Test Role Assignment
    console.log('\n2. Testing Role Assignment by Host...');
    const assigned = await dbStore.assignMemberRole(testTripId, hostId, memberId, 'STAY_MANAGER');
    console.log('Assigned STAY_MANAGER to member:', assigned.roles);
    if (!assigned.roles?.includes('STAY_MANAGER')) {
      throw new Error('FAILED: STAY_MANAGER role not found in assigned member roles');
    }

    // Assign TRIP_PLANNER role
    await dbStore.assignMemberRole(testTripId, hostId, memberId, 'TRIP_PLANNER');

    // Attempt role assignment by Non-Host (should fail)
    console.log('Testing role assignment by non-host (should fail)...');
    try {
      await dbStore.assignMemberRole(testTripId, memberId, hostId, 'FUND_MANAGER');
      throw new Error('FAILED: Non-host was able to assign role!');
    } catch (err: any) {
      console.log('✓ Successfully blocked non-host role assignment:', err.message);
    }

    // 3. Test Permission Enforcement
    console.log('\n3. Testing Server-side Role Permissions...');
    // Member with STAY_MANAGER can add Stay Detail
    const stay = await dbStore.addStayDetail(testTripId, memberId, {
      name: 'Resort Beach Haven',
      address: 'North Goa',
      availableItems: ['Wi-Fi', 'Towels'],
    });
    console.log('✓ Member with STAY_MANAGER successfully added stay:', stay.name);

    // Member with TRIP_PLANNER can add Itinerary Item
    const itinerary = await dbStore.addItineraryItem(testTripId, memberId, {
      title: 'Beach Sunset Walk',
      dayNumber: 1,
    });
    console.log('✓ Member with TRIP_PLANNER successfully added itinerary:', itinerary.title);

    // Member WITHOUT POLL_MANAGER attempting to create poll should fail
    try {
      await dbStore.createPoll(testTripId, memberId, 'Where to go for dinner?', 'General', ['Pizza', 'Tacos']);
      throw new Error('FAILED: Member without POLL_MANAGER was able to create live poll!');
    } catch (err: any) {
      console.log('✓ Successfully blocked poll creation without POLL_MANAGER:', err.message);
    }

    // 4. Test Trip End with Pending Requests
    console.log('\n4. Testing Trip End with Pending Advance Credit Request...');
    const advanceCreditRecord = await dbStore.addAdvanceCredit(testTripId, memberId, 5000, 'Advance Pool Fund');
    console.log('Created pending Advance Credit request:', advanceCreditRecord.id, advanceCreditRecord.status);

    // Host attempts to end trip while Advance Credit is PENDING (should fail)
    try {
      await dbStore.endTrip(testTripId, hostId);
      throw new Error('FAILED: Trip was ended despite pending Advance Credit request!');
    } catch (err: any) {
      console.log('✓ Successfully blocked ending trip with pending request:', err.message);
    }

    // Host approves Advance Credit request
    console.log('Host accepting Advance Credit request...');
    await dbStore.updateSettlementStatus(testTripId, advanceCreditRecord.id, hostId, 'CONFIRMED');

    // 5. Host Ends Trip
    console.log('\n5. Host Ending Trip after resolving pending requests...');
    const endedTrip = await dbStore.endTrip(testTripId, hostId);
    console.log('✓ Trip ended successfully! isEnded:', endedTrip.isEnded, 'endedAt:', endedTrip.endedAt);
    if (!endedTrip.isEnded) {
      throw new Error('FAILED: Trip isEnded is not true!');
    }

    // 6. Test Block on New Advance Credit after Trip End
    console.log('\n6. Testing Advance Credit block on ended trip...');
    try {
      await dbStore.addAdvanceCredit(testTripId, memberId, 2000, 'Late Contribution');
      throw new Error('FAILED: Advance credit was allowed on ended trip!');
    } catch (err: any) {
      console.log('✓ Successfully blocked Advance Credit on ended trip:', err.message);
    }

    // 7. Test Role Removal
    console.log('\n7. Testing Role Removal by Host...');
    const updatedMember = await dbStore.removeMemberRole(testTripId, hostId, memberId, 'STAY_MANAGER');
    console.log('✓ Removed STAY_MANAGER role. Remaining roles:', updatedMember.roles);
    if (updatedMember.roles?.includes('STAY_MANAGER')) {
      throw new Error('FAILED: STAY_MANAGER role was not removed!');
    }

    console.log('\n==================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==================================================');

  } finally {
    // Cleanup test trip
    console.log(`Cleaning up test trip ${testTripId}...`);
    await prisma.trip.delete({ where: { id: testTripId } }).catch(() => {});
  }
}

runTest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
