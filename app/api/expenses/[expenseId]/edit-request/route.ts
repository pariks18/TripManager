import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(
  request: Request,
  { params }: { params: { expenseId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { requestType, proposedData, reason } = await request.json();

    if (!requestType || (requestType !== 'EDIT' && requestType !== 'DELETE')) {
      return NextResponse.json({ error: 'Invalid requestType parameter' }, { status: 400 });
    }

    const editReq = await dbStore.submitEditRequest(
      params.expenseId,
      user.id,
      requestType,
      proposedData,
      reason
    );

    return NextResponse.json({ editRequest: editReq }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit edit request' }, { status: 400 });
  }
}
