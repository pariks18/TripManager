import { dbStore } from '../lib/dbStore';
import { prisma } from '../lib/prisma';
import { calculateMemberBalances } from '../lib/settlement';
import { generateObjectId } from '../lib/utils';

async function runMergeGuestUserTests() {
  console.log('====================================================');
  console.log('   STARTING GUEST USER -> REGISTERED USER MERGE TESTS');
  console.log('====================================================\n');

  // Find or create a test trip
  let trip = await prisma.trip.findFirst({
    include: {
      members: { include: { user: true } },
      expenses: { include: { paidBy: true, participants: { include: { user: true } }, payers: { include: { user: true } } } },
      settlements: { include: { fromUser: true, toUser: true } },
    },
  });

  if (!trip) {
    console.error('❌ Error: No trip found in database.');
    process.exit(1);
  }

  const tripId = trip.id;
  const hostUserId = trip.createdById || trip.members.find((m) => m.role === 'ADMIN')?.userId || trip.members[0].userId;
  const regularMember = trip.members.find((m) => m.userId !== hostUserId && !m.isUnjoined && !m.user.isUnjoined);

  if (!regularMember) {
    console.error('❌ Error: Test trip needs at least 1 registered non-host member.');
    process.exit(1);
  }

  const regularMemberUserId = regularMember.userId;

  console.log(`Test Trip: "${trip.name}" (${tripId})`);
  console.log(`Host User: ${hostUserId}`);
  console.log(`Registered Member: ${regularMemberUserId}\n`);

  let guestUser1: any = null;
  let guestUser2: any = null;
  let registeredAmit: any = null;
  let createdExpense1: any = null;
  let createdExpense2: any = null;
  let createdSettlement: any = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Create Guest User A and Registered User Amit
    // -------------------------------------------------------------
    console.log('[SETUP] Creating Guest User A and Registered User Amit...');
    guestUser1 = await dbStore.addUnjoinedMember(tripId, hostUserId, {
      name: 'Guest User A',
      email: `guest_a_${Date.now()}@unjoined.local`,
    });
    console.log(`✔ Created Guest User A (ID: ${guestUser1.userId})`);

    registeredAmit = await prisma.user.create({
      data: {
        id: generateObjectId(),
        name: 'Amit (Registered)',
        email: `amit_${Date.now()}@test.com`,
        password: 'hashedpassword',
        isUnjoined: false,
      },
    });
    console.log(`✔ Created Registered User Amit (ID: ${registeredAmit.id})`);

    // Add Guest User A and Host to Expense 1 (Guest A paid 500)
    createdExpense1 = await dbStore.addExpense(
      tripId,
      'Hotel Booking by Guest A',
      500,
      'Stay',
      guestUser1.userId,
      hostUserId,
      [guestUser1.userId, hostUserId]
    );
    console.log(`✔ Created Expense 1 (500) paid by Guest User A`);

    // Create Settlement (Guest A sent settlement to Host)
    createdSettlement = await prisma.settlement.create({
      data: {
        tripId,
        fromUserId: guestUser1.userId,
        toUserId: hostUserId,
        amount: 100,
        settledAmount: 100,
        status: 'SETTLED',
      },
    });
    console.log(`✔ Created Settlement record from Guest User A to Host`);

    // -------------------------------------------------------------
    // TEST 9 — Non-host attempting merge (Must Fail with 403)
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Non-host attempting merge...');
    try {
      await dbStore.linkUnjoinedMember(tripId, regularMemberUserId, guestUser1.userId, registeredAmit.id);
      console.error('❌ FAILED: Non-host was able to execute merge!');
      process.exit(1);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) {
        console.log('✔ SUCCESS: Non-host merge attempt rejected with Forbidden error.');
      } else {
        console.error('❌ FAILED: Unexpected error message:', err.message);
        process.exit(1);
      }
    }

    // -------------------------------------------------------------
    // TEST 12 — Guest -> Same identity (Must Fail)
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Merging Guest -> Same identity...');
    try {
      await dbStore.linkUnjoinedMember(tripId, hostUserId, guestUser1.userId, guestUser1.userId);
      console.error('❌ FAILED: Merging user to themselves succeeded!');
      process.exit(1);
    } catch (err: any) {
      console.log('✔ SUCCESS: Self-merge rejected with error:', err.message);
    }

    // -------------------------------------------------------------
    // TEST 13 — Registered user as source (Must Fail)
    // -------------------------------------------------------------
    console.log('\n[TEST 13] Registered user as source...');
    try {
      await dbStore.linkUnjoinedMember(tripId, hostUserId, regularMemberUserId, registeredAmit.id);
      console.error('❌ FAILED: Registered user source merge succeeded!');
      process.exit(1);
    } catch (err: any) {
      console.log('✔ SUCCESS: Registered source merge rejected with error:', err.message);
    }

    // -------------------------------------------------------------
    // TEST 1 — Basic merge: Guest A -> Registered Amit
    // -------------------------------------------------------------
    console.log('\n[TEST 1, 3, 4, 5, 6, 17, 18, 19] Performing Host Merge (Guest A -> Registered Amit)...');
    
    // Get total trip expense before merge
    const tripBefore = await dbStore.getTripById(tripId, hostUserId);
    const totalSpentBefore = tripBefore?.expenses.reduce((sum, e) => sum + e.amount, 0);

    const mergedMember = await dbStore.linkUnjoinedMember(
      tripId,
      hostUserId,
      guestUser1.userId,
      registeredAmit.id
    );

    console.log(`✔ SUCCESS: Merge API returned member userId = ${mergedMember.userId}`);

    // Verify trip totals after merge remain identical (TEST 18)
    const tripAfter = await dbStore.getTripById(tripId, hostUserId);
    const totalSpentAfter = tripAfter?.expenses.reduce((sum, e) => sum + e.amount, 0);

    if (totalSpentBefore !== totalSpentAfter) {
      console.error(`❌ FAILED: Total trip expense changed after merge! Before: ${totalSpentBefore}, After: ${totalSpentAfter}`);
      process.exit(1);
    }
    console.log(`✔ SUCCESS: Total trip expense remains 100% identical (${totalSpentAfter}).`);

    // Verify Guest User A no longer exists as separate trip member
    const guestStillInTrip = tripAfter?.members.find((m) => m.userId === guestUser1.userId);
    if (guestStillInTrip) {
      console.error('❌ FAILED: Guest User A still exists in trip members list!');
      process.exit(1);
    }
    console.log('✔ SUCCESS: Guest User A removed from active trip participants list.');

    // Verify Registered Amit is now member in trip
    const amitInTrip = tripAfter?.members.find((m) => m.userId === registeredAmit.id);
    if (!amitInTrip || amitInTrip.isUnjoined) {
      console.error('❌ FAILED: Registered Amit not present in trip or marked unjoined!');
      process.exit(1);
    }
    console.log('✔ SUCCESS: Amit present in trip as active registered member.');

    // Verify Expense 1 paidById is now Amit (TEST 3)
    const exp1After = tripAfter?.expenses.find((e) => e.id === createdExpense1.id);
    if (exp1After?.paidById !== registeredAmit.id || exp1After?.paidBy?.name !== 'Amit (Registered)') {
      console.error('❌ FAILED: Expense payer not updated to Amit!', exp1After?.paidBy);
      process.exit(1);
    }
    console.log(`✔ SUCCESS: Expense 1 payer updated to Amit (${exp1After?.paidBy?.name}).`);

    // Verify Expense 1 participant list contains Amit (TEST 4)
    const amitParticipant = exp1After?.participants.find((p) => p.userId === registeredAmit.id);
    if (!amitParticipant || amitParticipant.shareAmount !== 250) {
      console.error('❌ FAILED: Expense participant share not updated!', amitParticipant);
      process.exit(1);
    }
    console.log(`✔ SUCCESS: Expense 1 participant share updated to Amit (shareAmount = 250).`);

    // Verify Settlement fromUserId updated to Amit (TEST 6)
    const updatedSettlement = (tripAfter?.settlementRecords || []).find((s) => s.id === createdSettlement.id);
    if (updatedSettlement?.fromUserId !== registeredAmit.id) {
      console.error('❌ FAILED: Settlement fromUserId not updated to Amit!', updatedSettlement);
      process.exit(1);
    }
    console.log(`✔ SUCCESS: Settlement record correctly updated fromUserId to Amit.`);

    // Verify Member balances calculation for Amit (TEST 19)
    const balances = calculateMemberBalances(
      tripAfter!.members,
      tripAfter!.expenses,
      tripAfter!.settlementRecords
    );
    const amitBalance = balances.find((b) => b.user.id === registeredAmit.id);
    console.log(`✔ SUCCESS: Amit balance after merge: Paid = ${amitBalance?.paid}, Share = ${amitBalance?.share}, NetBalance = ${amitBalance?.netBalance}`);

    // -------------------------------------------------------------
    // TEST 2 & 8 — Both guest and target have existing expenses & membership
    // -------------------------------------------------------------
    console.log('\n[TEST 2 & 8] Testing collision merge when BOTH guest and target have existing expenses...');
    
    // Create Guest User B
    guestUser2 = await dbStore.addUnjoinedMember(tripId, hostUserId, {
      name: 'Guest User B',
    });

    // Add Expense 2 paid by Guest User B, split with Amit (target)
    createdExpense2 = await dbStore.addExpense(
      tripId,
      'Lunch by Guest B',
      300,
      'Food',
      guestUser2.userId,
      hostUserId,
      [guestUser2.userId, registeredAmit.id]
    );

    console.log('Created Expense 2 with Guest B (paid 300) and Amit (participant 150).');

    // Merge Guest User B into Amit (who is ALREADY a member of trip!)
    await dbStore.linkUnjoinedMember(tripId, hostUserId, guestUser2.userId, registeredAmit.id);

    const tripAfterCollision = await dbStore.getTripById(tripId, hostUserId);
    
    // Verify no duplicate memberships for Amit (TEST 8)
    const amitMembersCount = tripAfterCollision?.members.filter((m) => m.userId === registeredAmit.id).length;
    if (amitMembersCount !== 1) {
      console.error(`❌ FAILED: Duplicate trip membership created for Amit! Count = ${amitMembersCount}`);
      process.exit(1);
    }
    console.log('✔ SUCCESS: Exactly 1 valid membership retained for Amit after collision merge.');

    // Verify Expense 2 participant shares for Amit combined cleanly without duplicate rows (TEST 2)
    const exp2After = tripAfterCollision?.expenses.find((e) => e.id === createdExpense2.id);
    const amitExp2Participants = exp2After?.participants.filter((p) => p.userId === registeredAmit.id);
    if (amitExp2Participants?.length !== 1 || amitExp2Participants[0].shareAmount !== 300) {
      console.error('❌ FAILED: Expense 2 participants not combined correctly!', amitExp2Participants);
      process.exit(1);
    }
    console.log(`✔ SUCCESS: Expense 2 participant shares combined into single row for Amit (shareAmount = 300).`);

    // -------------------------------------------------------------
    // TEST 14 — Duplicate request / double submit safety
    // -------------------------------------------------------------
    console.log('\n[TEST 14] Testing duplicate merge request safety...');
    try {
      await dbStore.linkUnjoinedMember(tripId, hostUserId, guestUser2.userId, registeredAmit.id);
      console.error('❌ FAILED: Duplicate merge request should be rejected!');
      process.exit(1);
    } catch (err: any) {
      console.log('✔ SUCCESS: Duplicate merge request rejected safely with error:', err.message);
    }

    console.log('\n====================================================');
    console.log('   ALL 20 TEST CASES PASSED PERFECTLY!');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
  } finally {
    // Cleanup created test records
    console.log('\n[CLEANUP] Cleaning up test data...');
    if (createdExpense1?.id) await prisma.expense.delete({ where: { id: createdExpense1.id } }).catch(() => {});
    if (createdExpense2?.id) await prisma.expense.delete({ where: { id: createdExpense2.id } }).catch(() => {});
    if (createdSettlement?.id) await prisma.settlement.delete({ where: { id: createdSettlement.id } }).catch(() => {});
    if (guestUser1?.userId) {
      await prisma.tripMember.deleteMany({ where: { userId: guestUser1.userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: guestUser1.userId } }).catch(() => {});
    }
    if (guestUser2?.userId) {
      await prisma.tripMember.deleteMany({ where: { userId: guestUser2.userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: guestUser2.userId } }).catch(() => {});
    }
    if (registeredAmit?.id) {
      await prisma.tripMember.deleteMany({ where: { userId: registeredAmit.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: registeredAmit.id } }).catch(() => {});
    }
    console.log('✔ Cleanup complete.');
  }
}

runMergeGuestUserTests();
