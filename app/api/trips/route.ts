import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

// export async function GET() {
//   const user = await getSessionUser();
//   if (!user) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   const trips = await dbStore.getUserTrips(user.id);
//   return NextResponse.json({ trips });
// }

export async function GET() {
  const start = performance.now();

  const authStart = performance.now();
  const user = await getSessionUser();
  const authEnd = performance.now();

  console.log(`[PERF] getSessionUser: ${(authEnd - authStart).toFixed(2)}ms`);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tripsStart = performance.now();
  const trips = await dbStore.getUserTrips(user.id);
  const tripsEnd = performance.now();

  console.log(`[PERF] getUserTrips: ${(tripsEnd - tripsStart).toFixed(2)}ms`);
  console.log(`[PERF] TOTAL: ${(performance.now() - start).toFixed(2)}ms`);

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
