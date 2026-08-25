import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';
import { prisma } from '@/lib/prisma';
import { broadcastTripMessage } from '@/lib/chatStream';

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const beforeId = searchParams.get('before') || undefined;
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

    // Verify trip membership
    const member = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId: params.tripId, userId: user.id } },
    });
    if (!member) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this trip' }, { status: 403 });
    }

    const { messages, hasMore } = await dbStore.getTripMessages(params.tripId, limit, beforeId);

    return NextResponse.json({ messages, hasMore });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch trip messages' }, { status: 500 });
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
    const { content } = await request.json();
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const message = await dbStore.saveTripMessage(params.tripId, user.id, content);

    // Real-time instant broadcast to all active SSE subscribers for this trip
    broadcastTripMessage(params.tripId, message);

    return NextResponse.json({ message });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status });
  }
}
