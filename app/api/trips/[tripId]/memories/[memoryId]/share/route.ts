import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(
  req: NextRequest,
  { params }: { params: { tripId: string; memoryId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memoryId } = params;
    const body = await req.json();
    const { targetUserIds, privacy } = body;

    const memory = await dbStore.shareMemory(memoryId, user.id, targetUserIds || [], privacy || 'SHARED_SELECTIVE');

    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error('Error sharing memory:', error);
    return NextResponse.json({ error: error.message || 'Failed to share memory' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tripId: string; memoryId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, action } = body;

    const success = await dbStore.respondToShareRequest(requestId, user.id, action);

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error responding to share request:', error);
    return NextResponse.json({ error: error.message || 'Failed to update share request' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tripId: string; memoryId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memoryId } = params;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    const success = await dbStore.revokeMemoryShare(memoryId, user.id, targetUserId);

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error revoking share:', error);
    return NextResponse.json({ error: error.message || 'Failed to revoke share access' }, { status: 500 });
  }
}
