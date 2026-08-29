import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';
import { broadcastTripMessage } from '@/lib/chatStream';

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbStore.markTripMessagesAsRead(params.tripId, user.id);

    // Broadcast read event to subscribers
    broadcastTripMessage(params.tripId, {
      id: `read-${user.id}-${Date.now()}`,
      tripId: params.tripId,
      senderId: user.id,
      content: '__READ_RECEIPT__',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    return NextResponse.json({ success: true, unreadCount: 0 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
