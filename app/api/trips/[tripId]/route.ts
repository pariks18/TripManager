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
    const body = await request.json();
    const { budget, approvalMode } = body;

    const numBudget =
      budget !== undefined
        ? budget !== null && budget !== ''
          ? parseFloat(budget)
          : null
        : undefined;

    await dbStore.updateTripSettings(params.tripId, user.id, {
      budget: numBudget,
      approvalMode: typeof approvalMode === 'boolean' ? approvalMode : undefined,
    });

    const updatedTrip = await dbStore.getTripById(params.tripId, user.id);

    return NextResponse.json({ trip: updatedTrip });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update trip settings' }, { status });
  }
}


