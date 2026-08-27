import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PUT(
  req: NextRequest,
  { params }: { params: { tripId: string; memoryId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memoryId, tripId } = params;
    const body = await req.json();

    const updated = await dbStore.saveMemory({
      ...body,
      id: memoryId,
      tripId,
      userId: user.id,
    });

    return NextResponse.json({ memory: updated });
  } catch (error: any) {
    console.error('Error updating memory:', error);
    return NextResponse.json({ error: error.message || 'Failed to update memory' }, { status: 500 });
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
    const success = await dbStore.deleteMemory(memoryId, user.id);

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete memory' }, { status: 500 });
  }
}
