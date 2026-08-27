import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function GET(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripId = params.tripId;
    const { memories, shareRequests } = await dbStore.getTripMemories(tripId, user.id);

    return NextResponse.json({ memories, shareRequests });
  } catch (error: any) {
    console.error('Error fetching trip memories:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripId = params.tripId;
    const body = await req.json();

    const memory = await dbStore.saveMemory({
      ...body,
      tripId,
      userId: user.id,
    });

    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error('Error saving memory:', error);
    return NextResponse.json({ error: error.message || 'Failed to save memory' }, { status: 500 });
  }
}
