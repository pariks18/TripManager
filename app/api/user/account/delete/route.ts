import { NextResponse } from 'next/server';
import { getSessionUser, removeAuthCookie } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(request: Request) {
  const userSession = await getSessionUser();
  if (!userSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { confirmation } = await request.json();
    if (confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Please type DELETE to confirm account deletion' }, { status: 400 });
    }

    await dbStore.deleteUserAccount(userSession.id);
    await removeAuthCookie();

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 400 });
  }
}
