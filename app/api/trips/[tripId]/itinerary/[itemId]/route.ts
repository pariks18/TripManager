import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PUT(
  request: Request,
  { params }: { params: { tripId: string; itemId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const item = await dbStore.updateItineraryItem(params.itemId, user.id, body);
    return NextResponse.json({ item });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update itinerary item' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string; itemId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbStore.deleteItineraryItem(params.itemId, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to delete itinerary item' }, { status });
  }
}
