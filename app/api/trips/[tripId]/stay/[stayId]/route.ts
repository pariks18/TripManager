import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PUT(
  request: Request,
  { params }: { params: { tripId: string; stayId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const stay = await dbStore.updateStayDetail(params.stayId, user.id, body);
    return NextResponse.json({ stay });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update stay details' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string; stayId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbStore.deleteStayDetail(params.stayId, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to delete stay details' }, { status });
  }
}
