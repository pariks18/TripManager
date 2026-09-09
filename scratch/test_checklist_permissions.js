const { dbStore } = require('./lib/dbStore');

async function testChecklistPermissions() {
  console.log('--- STARTING CHECKLIST PERMISSION TESTS ---');

  const tripId = '65f1a2b3c4d5e6f7a8b9t001'; // Goa Trip 2026
  const hostUserId = '65f1a2b3c4d5e6f7a8b9c001'; // Parikshit Gole (Host/Admin)
  const regularMemberUserId = '65f1a2b3c4d5e6f7a8b9c002'; // Rahul Sharma (Regular Member)
  const thirdMemberUserId = '65f1a2b3c4d5e6f7a8b9c003'; // Akash Verma (Regular Member)

  let createdItemHostId = null;
  let createdItemMemberId = null;

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
    console.log('\n[Test 2] Host reassigning group item to third member...');
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
    } catch (err) {
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
    } catch (err) {
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
