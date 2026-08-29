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
  return handleUpdate(request, params.tripId);
}

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  return handleUpdate(request, params.tripId);
}

async function handleUpdate(request: Request, tripId: string) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, startDate, endDate, budget, currency, approvalMode } = body;

    const numBudget =
      budget !== undefined
        ? budget !== null && budget !== ''
          ? parseFloat(budget)
          : null
        : undefined;

    await dbStore.updateTripSettings(tripId, user.id, {
      name: typeof name === 'string' ? name : undefined,
      startDate: startDate !== undefined ? startDate : undefined,
      endDate: endDate !== undefined ? endDate : undefined,
      budget: numBudget,
      currency: typeof currency === 'string' ? currency : undefined,
      approvalMode: typeof approvalMode === 'boolean' ? approvalMode : undefined,
    });

    const updatedTrip = await dbStore.getTripById(tripId, user.id);

    return NextResponse.json({ trip: updatedTrip });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update trip settings' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbStore.deleteTrip(params.tripId, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to delete trip' }, { status });
  }
}


