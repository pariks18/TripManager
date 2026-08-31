import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { gender } = await request.json();
    if (!gender || typeof gender !== 'string') {
      return NextResponse.json({ error: 'Gender value is required' }, { status: 400 });
    }

    await dbStore.updateUserGender(user.id, gender);
    return NextResponse.json({ success: true, gender });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update user gender' },
      { status: 400 }
    );
  }
}
