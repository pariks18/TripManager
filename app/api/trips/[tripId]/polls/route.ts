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
    const polls = await dbStore.getTripPolls(params.tripId, user.id);
    return NextResponse.json({ polls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch polls' }, { status: 400 });
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
    const { question, category, options } = await request.json();

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'A live poll requires a question and at least 2 options.' },
        { status: 400 }
      );
    }

    const poll = await dbStore.createPoll(
      params.tripId,
      user.id,
      question,
      category || 'General',
      options
    );

    return NextResponse.json({ poll });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create poll' }, { status: 400 });
  }
}
