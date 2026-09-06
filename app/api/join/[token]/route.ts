import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const user = await getSessionUser();
    const result = await dbStore.getPublicTripByInviteToken(params.token, user?.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invite details' },
      { status: 400 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const result = await dbStore.joinTripViaInviteToken(user.id, params.token);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to join trip' },
      { status: 400 }
    );
  }
}
