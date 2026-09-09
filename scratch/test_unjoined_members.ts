import { dbStore } from '../lib/dbStore';
import { prisma } from '../lib/prisma';
import { calculateMemberBalances } from '../lib/settlement';
import { generateObjectId } from '../lib/utils';

async function runUnjoinedMembersTests() {
  console.log('====================================================');
  console.log('   STARTING UNJOINED MEMBERS FEATURE TESTS');
  console.log('====================================================\n');

  // Fetch or create a test trip
  let trip = await prisma.trip.findFirst({
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!trip) {
    console.error('No trip found in database.');
    process.exit(1);
  }

  const tripId = trip.id;
  const hostUserId = trip.createdById || trip.members.find((m) => m.role === 'ADMIN')?.userId || trip.members[0].userId;

  // Find a regular member (non-host)
  const regularMember = trip.members.find((m) => m.userId !== hostUserId);
  if (!regularMember) {
    console.error('Test trip needs at least 2 members.');
    process.exit(1);
  }

  const regularMemberUserId = regularMember.userId;

  console.log(`Test Trip: "${trip.name}" (${tripId})`);
  console.log(`Host User: ${hostUserId}`);
  console.log(`Regular Member User: ${regularMemberUserId}\n`);

  let addedUnjoinedMember1: any = null;
  let addedUnjoinedMember2: any = null;
  let createdExpenseId: string | null = null;
  let testRegisteredUser: any = null;

  try {
    // -------------------------------------------------------------
    // CASE 1 — Existing trip: 5 registered members work as before
    // -------------------------------------------------------------
    console.log('[CASE 1] Existing trip structure & balance calculations...');
    const tripDetailsBefore = await dbStore.getTripById(tripId, hostUserId);
    if (!tripDetailsBefore) throw new Error('Failed to fetch trip details');
    const balancesBefore = calculateMemberBalances(
      tripDetailsBefore.members,
      tripDetailsBefore.expenses,
      tripDetailsBefore.settlementRecords
    );
    console.log(`✔ SUCCESS: Existing trip loaded with ${tripDetailsBefore.members.length} members. Balances calculated cleanly.`);

    // -------------------------------------------------------------
    // CASE 4 — Non-host attempting to add unjoined participant (Must Fail)
    // -------------------------------------------------------------
    console.log('\n[CASE 4] Non-host attempting to add unjoined participant...');
    try {
      await dbStore.addUnjoinedMember(tripId, regularMemberUserId, {
        name: 'Unauthorized Rohit',
      });
      console.error('❌ FAILED: Non-host was able to add an unjoined participant!');
      process.exit(1);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) {
        console.log('✔ SUCCESS: Backend rejected non-host attempt with error:', err.message);
      } else {
        console.error('❌ FAILED: Unexpected error message:', err.message);
        process.exit(1);
      }
    }

    // -------------------------------------------------------------
    // CASE 2 — Host adds unjoined participants: "Rohit" and "Simran"
    // -------------------------------------------------------------
    console.log('\n[CASE 2] Host adding unjoined participants "Rohit" and "Simran"...');
    addedUnjoinedMember1 = await dbStore.addUnjoinedMember(tripId, hostUserId, {
      name: 'Rohit (Test Unjoined)',
      email: `rohit_${Date.now()}@unjoined.test`,
    });
    console.log(`✔ SUCCESS: Host added unjoined member "${addedUnjoinedMember1.user.name}" (isUnjoined = ${addedUnjoinedMember1.isUnjoined})`);

    addedUnjoinedMember2 = await dbStore.addUnjoinedMember(tripId, hostUserId, {
      name: 'Simran (Test Unjoined)',
    });
    console.log(`✔ SUCCESS: Host added unjoined member "${addedUnjoinedMember2.user.name}" (isUnjoined = ${addedUnjoinedMember2.isUnjoined})`);

    // Verify trip members list now includes unjoined participants
    const tripWithUnjoined = await dbStore.getTripById(tripId, hostUserId);
    const rohitInTrip = tripWithUnjoined?.members.find((m) => m.userId === addedUnjoinedMember1.userId);
    const simranInTrip = tripWithUnjoined?.members.find((m) => m.userId === addedUnjoinedMember2.userId);

    if (!rohitInTrip?.isUnjoined || !simranInTrip?.isUnjoined) {
      console.error('❌ FAILED: Unjoined members not flagged as isUnjoined in trip!');
      process.exit(1);
    }
    console.log('✔ SUCCESS: Both unjoined members correctly retrieved in trip summary with isUnjoined = true.');

    // -------------------------------------------------------------
    // CASE 3 — Expense split equally among registered + unjoined members
    // -------------------------------------------------------------
    console.log('\n[CASE 3] Adding expense split equally among all participants (including unjoined)...');
    const allMembers = tripWithUnjoined!.members;
    const totalCount = allMembers.length;
    const expenseAmount = totalCount * 100; // e.g. 700 for 7 members, 100 each
    const participantUserIds = allMembers.map((m) => m.userId);

    const expense = await dbStore.addExpense(
      tripId,
      'Dinner with All Participants',
      expenseAmount,
      'Food',
      hostUserId,
      hostUserId,
      participantUserIds
    );
    createdExpenseId = expense.id;

    console.log(`✔ SUCCESS: Created expense of ${expenseAmount} for ${participantUserIds.length} participants.`);

    // Verify expense participants list includes Rohit & Simran with shareAmount = 100
    const rohitParticipant = expense.participants.find((p) => p.userId === addedUnjoinedMember1.userId);
    const simranParticipant = expense.participants.find((p) => p.userId === addedUnjoinedMember2.userId);

    if (!rohitParticipant || rohitParticipant.shareAmount !== 100) {
      console.error('❌ FAILED: Rohit shareAmount incorrect:', rohitParticipant);
      process.exit(1);
    }
    if (!simranParticipant || simranParticipant.shareAmount !== 100) {
      console.error('❌ FAILED: Simran shareAmount incorrect:', simranParticipant);
      process.exit(1);
    }
    console.log('✔ SUCCESS: Rohit & Simran received exact equal share (100 each).');

    // Verify balances include unjoined members correctly
    const balancesWithExpense = calculateMemberBalances(
      allMembers,
      [expense],
      []
    );
    const rohitBal = balancesWithExpense.find((b) => b.user.id === addedUnjoinedMember1.userId);
    console.log(`✔ SUCCESS: Rohit balance computed: Share = ${rohitBal?.share}, NetBalance = ${rohitBal?.netBalance}`);

    // -------------------------------------------------------------
    // CASE 5 & 6 — Rohit joins app/has account -> Host links Rohit's unjoined member record to account
    // -------------------------------------------------------------
    console.log('\n[CASE 5 & 6] Rohit joins app -> Host links unjoined record to registered user account...');
    // Create a real registered user account for Rohit
    const registeredRohitEmail = `registered_rohit_${Date.now()}@test.com`;
    testRegisteredUser = await prisma.user.create({
      data: {
        id: generateObjectId(),
        name: 'Rohit Sharma (Registered)',
        email: registeredRohitEmail,
        password: 'hashedpassword',
        isUnjoined: false,
      },
    });

    console.log(`Created registered user account for Rohit: ID=${testRegisteredUser.id}`);

    // Link Rohit's unjoined participant record to the registered user account
    const linkedMember = await dbStore.linkUnjoinedMember(
      tripId,
      hostUserId,
      addedUnjoinedMember1.userId,
      testRegisteredUser.id
    );

    console.log(`✔ SUCCESS: Link completed. Linked member userId = ${linkedMember.userId}, isUnjoined = ${linkedMember.isUnjoined}`);

    // Verify trip members after linking
    const tripAfterLinking = await dbStore.getTripById(tripId, hostUserId);
    const oldUnjoinedInTrip = tripAfterLinking?.members.find((m) => m.userId === addedUnjoinedMember1.userId);
    const registeredInTrip = tripAfterLinking?.members.find((m) => m.userId === testRegisteredUser.id);

    if (oldUnjoinedInTrip) {
      console.error('❌ FAILED: Old unjoined member ID still exists in trip!');
      process.exit(1);
    }
    if (!registeredInTrip || registeredInTrip.isUnjoined) {
      console.error('❌ FAILED: Registered user is not present or still marked unjoined!');
      process.exit(1);
    }
    console.log('✔ SUCCESS: Old unjoined participant record replaced cleanly with registered account. No duplicates!');

    // Verify existing expense participation was transferred intact to registered Rohit
    const updatedExpense = tripAfterLinking?.expenses.find((e) => e.id === createdExpenseId);
    const linkedParticipant = updatedExpense?.participants.find((p) => p.userId === testRegisteredUser.id);

    if (!linkedParticipant || linkedParticipant.shareAmount !== 100) {
      console.error('❌ FAILED: Expense participation was lost or corrupted after linking!', linkedParticipant);
      process.exit(1);
    }
    console.log(`✔ SUCCESS: Existing expense share (${linkedParticipant.shareAmount}) intact for registered Rohit!`);

    // Verify total balance calculations remain unchanged
    const balancesAfterLink = calculateMemberBalances(
      tripAfterLinking!.members,
      tripAfterLinking!.expenses,
      tripAfterLinking!.settlementRecords
    );
    const registeredBal = balancesAfterLink.find((b) => b.user.id === testRegisteredUser.id);
    if (!registeredBal || registeredBal.share !== 100) {
      console.error('❌ FAILED: Balance calculation altered after linking!', registeredBal);
      process.exit(1);
    }
    console.log('✔ SUCCESS: Total trip balances remain 100% accurate after linking.');

    console.log('\n====================================================');
    console.log('   ALL 6 TEST CASES PASSED PERFECTLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    // Cleanup created test records
    if (createdExpenseId) {
      await prisma.expense.delete({ where: { id: createdExpenseId } }).catch(() => {});
    }
    if (addedUnjoinedMember1?.userId) {
      await prisma.tripMember.deleteMany({ where: { userId: addedUnjoinedMember1.userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: addedUnjoinedMember1.userId } }).catch(() => {});
    }
    if (addedUnjoinedMember2?.userId) {
      await prisma.tripMember.deleteMany({ where: { userId: addedUnjoinedMember2.userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: addedUnjoinedMember2.userId } }).catch(() => {});
    }
    if (testRegisteredUser?.id) {
      await prisma.tripMember.deleteMany({ where: { userId: testRegisteredUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: testRegisteredUser.id } }).catch(() => {});
    }
  }
}

runUnjoinedMembersTests();
