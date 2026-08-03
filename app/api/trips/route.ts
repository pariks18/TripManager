import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trips = await dbStore.getUserTrips(user.id);
  return NextResponse.json({ trips });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, currency, startDate, endDate } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Trip name is required' }, { status: 400 });
    }

    const trip = await dbStore.createTrip(
      user.id,
      name.trim(),
      description?.trim() || '',
      currency || '₹',
      startDate,
      endDate
    );

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create trip' }, { status: 500 });
  }
}
