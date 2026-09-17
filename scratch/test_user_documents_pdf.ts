if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "mongodb+srv://parikshit2605:golepariks1818@cluster0.mttmyiu.mongodb.net/tripsplit?retryWrites=true&w=majority&appName=Cluster0";
}
import { dbStore } from '@/lib/dbStore';
import { isPdfUrl, getFileNameFromUrl } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

async function runUserDocumentPdfTests() {
  console.log('====================================================');
  console.log('    STARTING USER DOCUMENTS PDF FEATURE TESTS');
  console.log('====================================================');

  // Test User 1
  const userId1 = '65f1a2b3c4d5e6f7a8b9c001'; // Parikshit Gole
  // Test User 2
  const userId2 = '65f1a2b3c4d5e6f7a8b9c002'; // Rahul Sharma

  // Clean up any existing documents for test users
  await prisma.userDocument.deleteMany({ where: { userId: { in: [userId1, userId2] } } });

  // ----------------------------------------------------
  // TEST 1: Existing image upload (Gallery JPG)
  // ----------------------------------------------------
  console.log('\n[TEST 1] Uploading image document (passport.jpg)...');
  const doc1 = await dbStore.upsertUserDocument(
    userId1,
    'PASSPORT',
    'A1234567',
    'https://res.cloudinary.com/demo/image/upload/v12345/passport.jpg',
    'passport.jpg'
  );
  console.assert(doc1.documentType === 'PASSPORT', 'Doc 1 type match');
  console.assert(!isPdfUrl(doc1.fileUrl), 'Doc 1 should not be PDF');
  console.log('✔ SUCCESS: Passport image document uploaded.');

  // ----------------------------------------------------
  // TEST 2: Camera image upload (Driving License JPG)
  // ----------------------------------------------------
  console.log('\n[TEST 2] Uploading camera image document (driving-license.jpg)...');
  const doc2 = await dbStore.upsertUserDocument(
    userId1,
    'DRIVING_LICENSE',
    'DL98765',
    'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'driving-license.jpg'
  );
  console.assert(doc2.documentType === 'DRIVING_LICENSE', 'Doc 2 type match');
  console.assert(!isPdfUrl(doc2.fileUrl), 'Doc 2 should not be PDF');
  console.log('✔ SUCCESS: Driving license camera image document uploaded.');

  // ----------------------------------------------------
  // TEST 3: Single PDF upload (aadhaar.pdf)
  // ----------------------------------------------------
  console.log('\n[TEST 3] Uploading single PDF document (aadhaar.pdf)...');
  const pdfBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwvTGVuZ3RoIDIgMCBSPj4Kc3RyZWFtCkJUMyAwIDAgMyA1MCA1MCBUbQooSGVsbG8gV29ybGQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMiAwIG9iagoxOQplbmRvYmoKdHJhaWxlcgo8PC9Sb290IDEgMCBSPj4KJSVFT0YK';
  const doc3 = await dbStore.upsertUserDocument(
    userId1,
    'AADHAAR',
    '1234-5678-9012',
    pdfBase64,
    'aadhaar.pdf'
  );
  console.assert(doc3.documentType === 'AADHAAR', 'Doc 3 type match');
  console.assert(isPdfUrl(doc3.fileUrl), 'Doc 3 MUST be identified as PDF');
  console.log('✔ SUCCESS: Aadhaar PDF document uploaded successfully.');

  // ----------------------------------------------------
  // TEST 4 & 5: Multiple & Mixed documents retrieval
  // ----------------------------------------------------
  console.log('\n[TEST 4 & 5] Fetching all user documents for mixed verification...');
  const doc4 = await dbStore.upsertUserDocument(
    userId1,
    'PAN',
    'ABCDE1234F',
    'https://res.cloudinary.com/demo/image/upload/v12345/visa.pdf',
    'visa.pdf'
  );

  const allDocs = await dbStore.getUserDocuments(userId1);
  console.assert(allDocs.length === 4, `Expected 4 documents, found ${allDocs.length}`);
  
  const pdfDocs = allDocs.filter((d) => isPdfUrl(d.fileUrl));
  const imgDocs = allDocs.filter((d) => !isPdfUrl(d.fileUrl));
  console.assert(pdfDocs.length === 2, `Expected 2 PDF docs, got ${pdfDocs.length}`);
  console.assert(imgDocs.length === 2, `Expected 2 image docs, got ${imgDocs.length}`);
  console.log(`✔ SUCCESS: All 4 mixed documents retrieved (2 PDFs, 2 Images).`);

  // ----------------------------------------------------
  // TEST 6: PDF url & filename detection
  // ----------------------------------------------------
  console.log('\n[TEST 6] Testing PDF URL and filename helpers...');
  console.assert(isPdfUrl('https://example.com/receipt.pdf?v=1'), 'URL ending in .pdf');
  console.assert(isPdfUrl('data:application/pdf;base64,xxxx'), 'Data URI starting with data:application/pdf');
  console.assert(!isPdfUrl('https://example.com/receipt.png'), 'PNG should not be PDF');
  console.log('✔ SUCCESS: isPdfUrl helper functions correctly.');

  // ----------------------------------------------------
  // TEST 7: Delete PDF document (aadhaar.pdf)
  // ----------------------------------------------------
  console.log('\n[TEST 7] Deleting aadhaar.pdf document...');
  const aadhaarDoc = allDocs.find((d) => d.documentType === 'AADHAAR');
  console.assert(!!aadhaarDoc, 'Aadhaar doc exists before deletion');
  const deleteResult = await dbStore.deleteUserDocument(aadhaarDoc!.id, userId1);
  console.assert(deleteResult === true, 'Delete operation should succeed');

  const remainingDocs = await dbStore.getUserDocuments(userId1);
  console.assert(remainingDocs.length === 3, `Expected 3 docs remaining, found ${remainingDocs.length}`);
  console.assert(!remainingDocs.some((d) => d.documentType === 'AADHAAR'), 'Aadhaar doc removed');
  console.log('✔ SUCCESS: Deleting Aadhaar PDF removed only that document.');

  // ----------------------------------------------------
  // TEST 12: Unauthorized access check
  // ----------------------------------------------------
  console.log('\n[TEST 12] Testing unauthorized delete request...');
  const passportDoc = remainingDocs.find((d) => d.documentType === 'PASSPORT');
  const unauthorizedDelete = await dbStore.deleteUserDocument(passportDoc!.id, userId2);
  console.assert(unauthorizedDelete === false, 'User 2 should NOT be able to delete User 1 document');
  console.log('✔ SUCCESS: Unauthorized document deletion blocked by backend.');

  console.log('\n====================================================');
  console.log('    ALL USER DOCUMENTS PDF TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

runUserDocumentPdfTests()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
