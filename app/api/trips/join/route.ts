import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await request.json();

    if (!code || code.trim() === '') {
      return NextResponse.json({ error: 'Trip code is required' }, { status: 400 });
    }

    const trip = await dbStore.joinTripByCode(user.id, code);
    return NextResponse.json({ trip, message: `Successfully joined ${trip.name}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to join trip' }, { status: 400 });
  }
}
