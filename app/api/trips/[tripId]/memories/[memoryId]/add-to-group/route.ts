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
    const groupMemory = await dbStore.addToGroupMemory(memoryId, user.id);

    return NextResponse.json({ memory: groupMemory });
  } catch (error: any) {
    console.error('Error adding memory to group:', error);
    return NextResponse.json({ error: error.message || 'Failed to add to group memory' }, { status: 500 });
  }
}
