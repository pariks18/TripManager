import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trip = await dbStore.getTripById(params.tripId, user.id);
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found or permission denied' }, { status: 404 });
  }

  return NextResponse.json({ trip });
}
