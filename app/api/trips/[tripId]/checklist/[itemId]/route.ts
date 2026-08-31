import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string; itemId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, assignedToId, title } = body;

    const item = await dbStore.updateChecklistItem(params.itemId, user.id, {
      status,
      assignedToId,
      title,
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    const httpStatus = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to update checklist item' },
      { status: httpStatus }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string; itemId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbStore.deleteChecklistItem(params.itemId, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const httpStatus = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to delete checklist item' },
      { status: httpStatus }
    );
  }
}
