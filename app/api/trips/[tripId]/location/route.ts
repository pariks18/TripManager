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

  try {
    const locations = await dbStore.getTripMemberLocations(params.tripId, user.id);
    return NextResponse.json({ locations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch member locations' }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { latitude, longitude, accuracy, isSharing } = await request.json();

    const location = await dbStore.updateMemberLocation(
      params.tripId,
      user.id,
      parseFloat(latitude),
      parseFloat(longitude),
      accuracy ? parseFloat(accuracy) : undefined,
      isSharing !== undefined ? isSharing : true
    );

    return NextResponse.json({ location });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update location' }, { status: 400 });
  }
}
