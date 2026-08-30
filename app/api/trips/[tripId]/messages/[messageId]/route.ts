import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';
import { broadcastTripMessage } from '@/lib/chatStream';

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string; messageId: string } }
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

    const updatedMessage = await dbStore.editTripMessage(params.messageId, user.id, content);

    // Broadcast edit event to all SSE subscribers
    broadcastTripMessage(params.tripId, updatedMessage);

    return NextResponse.json({ message: updatedMessage });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to edit message' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string; messageId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const unsentMessage = await dbStore.unsendTripMessage(params.messageId, user.id);

    // Broadcast unsend event to all SSE subscribers
    broadcastTripMessage(params.tripId, unsentMessage);

    return NextResponse.json({ message: unsentMessage });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to unsend message' }, { status });
  }
}
