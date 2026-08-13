import { NextResponse } from 'next/server';
import { getSessionUser, signJWT, setAuthCookie } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function GET() {
  const userSession = await getSessionUser();
  if (!userSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await dbStore.getUserProfile(userSession.id);
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const userSession = await getSessionUser();
  if (!userSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const previousProfile = await dbStore.getUserProfile(userSession.id);
    const updatedProfile = await dbStore.updateUserProfile(userSession.id, body);

    // Refresh JWT Cookie if name or email changed
    if (updatedProfile.name !== userSession.name || updatedProfile.email !== userSession.email) {
      const newToken = await signJWT({
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
      });
      await setAuthCookie(newToken);
    }

    return NextResponse.json({
      profile: updatedProfile,
      previousProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 400 });
  }
}
