import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, reason } = await request.json();

    if (action === 'APPROVE') {
      await dbStore.approveEditRequest(params.requestId, user.id);
      return NextResponse.json({ success: true, message: 'Edit request approved' });
    } else if (action === 'REJECT') {
      await dbStore.rejectEditRequest(params.requestId, user.id, reason);
      return NextResponse.json({ success: true, message: 'Edit request rejected' });
    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to process edit request' }, { status });
  }
}
