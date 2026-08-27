import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudinary) {
      return NextResponse.json({
        message: 'Cloudinary environment variables not configured. Skipping migration.',
        migrated: 0,
        skipped: 0,
        failed: 0,
      });
    }

    let totalFound = 0;
    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    // 1. Migrate Trip Memories Photos
    const memories = await prisma.tripMemory.findMany();
    for (const mem of memories) {
      if (mem.photos && mem.photos.length > 0) {
        let updated = false;
        const newPhotos: string[] = [];

        for (const photo of mem.photos) {
          totalFound++;
          if (photo.startsWith('https://res.cloudinary.com/')) {
            skipped++;
            newPhotos.push(photo);
          } else if (photo.startsWith('data:') || photo.startsWith('http')) {
            try {
              const res = await uploadToCloudinary(photo, 'memories');
              newPhotos.push(res.secureUrl);
              migrated++;
              updated = true;
            } catch (err: any) {
              failed++;
              errors.push(`Memory ${mem.id} photo upload failed: ${err.message}`);
              newPhotos.push(photo); // preserve original on error
            }
          } else {
            skipped++;
            newPhotos.push(photo);
          }
        }

        if (updated) {
          await prisma.tripMemory.update({
            where: { id: mem.id },
            data: { photos: newPhotos },
          });
        }
      }
    }

    // 2. Migrate User Documents
    const docs = await prisma.userDocument.findMany();
    for (const doc of docs) {
      if (doc.documentUrl) {
        totalFound++;
        if (doc.documentUrl.startsWith('https://res.cloudinary.com/')) {
          skipped++;
        } else if (doc.documentUrl.startsWith('data:') || doc.documentUrl.startsWith('http')) {
          try {
            const res = await uploadToCloudinary(doc.documentUrl, 'documents');
            await prisma.userDocument.update({
              where: { id: doc.id },
              data: { documentUrl: res.secureUrl },
            });
            migrated++;
          } catch (err: any) {
            failed++;
            errors.push(`UserDocument ${doc.id} upload failed: ${err.message}`);
          }
        } else {
          skipped++;
        }
      }
    }

    // 3. Migrate Expense Receipts
    const expenses = await prisma.expense.findMany();
    for (const exp of expenses) {
      if (exp.receiptUrl) {
        totalFound++;
        if (exp.receiptUrl.startsWith('https://res.cloudinary.com/')) {
          skipped++;
        } else if (exp.receiptUrl.startsWith('data:') || exp.receiptUrl.startsWith('http')) {
          try {
            const res = await uploadToCloudinary(exp.receiptUrl, 'receipts');
            await prisma.expense.update({
              where: { id: exp.id },
              data: { receiptUrl: res.secureUrl },
            });
            migrated++;
          } catch (err: any) {
            failed++;
            errors.push(`Expense ${exp.id} upload failed: ${err.message}`);
          }
        } else {
          skipped++;
        }
      }
    }

    // 4. Migrate Settlement Proofs
    const settlements = await prisma.settlement.findMany();
    for (const s of settlements) {
      if (s.reversalProofUrl && !s.reversalProofUrl.startsWith('https://res.cloudinary.com/')) {
        totalFound++;
        try {
          const res = await uploadToCloudinary(s.reversalProofUrl, 'proofs');
          await prisma.settlement.update({
            where: { id: s.id },
            data: { reversalProofUrl: res.secureUrl },
          });
          migrated++;
        } catch (err: any) {
          failed++;
          errors.push(`Settlement ${s.id} reversalProofUrl upload failed: ${err.message}`);
        }
      }
      if (s.reversalRecipientProofUrl && !s.reversalRecipientProofUrl.startsWith('https://res.cloudinary.com/')) {
        totalFound++;
        try {
          const res = await uploadToCloudinary(s.reversalRecipientProofUrl, 'proofs');
          await prisma.settlement.update({
            where: { id: s.id },
            data: { reversalRecipientProofUrl: res.secureUrl },
          });
          migrated++;
        } catch (err: any) {
          failed++;
          errors.push(`Settlement ${s.id} reversalRecipientProofUrl upload failed: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      summary: {
        totalFound,
        migrated,
        skipped,
        failed,
        errors,
      },
    });
  } catch (error: any) {
    console.error('Error running Cloudinary migration:', error);
    return NextResponse.json({ error: error.message || 'Migration failed' }, { status: 500 });
  }
}
