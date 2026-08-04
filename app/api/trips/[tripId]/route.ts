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

export async function PUT(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { budget } = await request.json();
    const numBudget = budget !== null && budget !== undefined && budget !== '' ? parseFloat(budget) : null;

    await dbStore.updateTripBudget(params.tripId, user.id, numBudget);
    const updatedTrip = await dbStore.getTripById(params.tripId, user.id);

    return NextResponse.json({ trip: updatedTrip });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update trip budget' }, { status });
  }
}

