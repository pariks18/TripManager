import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(
  request: Request,
  { params }: { params: { tripId: string; pollId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { optionId } = await request.json();

    if (!optionId) {
      return NextResponse.json({ error: 'optionId is required' }, { status: 400 });
    }

    await dbStore.voteInPoll(params.tripId, user.id, params.pollId, optionId);

    return NextResponse.json({ success: true, message: 'Vote recorded' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record vote' }, { status: 400 });
  }
}
