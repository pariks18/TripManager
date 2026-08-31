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
    const data = await dbStore.getTripChecklist(params.tripId, user.id);
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trip checklist' },
      { status }
    );
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
    const body = await request.json();
    const { type, title, category, assignedToId } = body;

    if (!type || !['GROUP', 'PERSONAL'].includes(type)) {
      return NextResponse.json({ error: 'Valid item type (GROUP or PERSONAL) is required' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Item title is required' }, { status: 400 });
    }

    const item = await dbStore.addChecklistItem(params.tripId, user.id, {
      type,
      title: title.trim(),
      category: category ? category.trim() : undefined,
      assignedToId: assignedToId || null,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to add checklist item' },
      { status }
    );
  }
}
