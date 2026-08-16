import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        recoveryEmail: null,
        isRecoveryEmailVerified: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: '✓ Recovery email removed successfully',
    });
  } catch (error: any) {
    console.error('[API /api/user/recovery-email/remove error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove recovery email' }, { status: 400 });
  }
}
