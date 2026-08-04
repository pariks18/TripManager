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
    const { action, reason } = await request.json();

    if (action === 'APPROVE') {
      await dbStore.approveExpense(params.expenseId, user.id);
      return NextResponse.json({ success: true, message: 'Expense approved' });
    } else if (action === 'REJECT') {
      await dbStore.rejectExpense(params.expenseId, user.id, reason);
      return NextResponse.json({ success: true, message: 'Expense rejected' });
    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to process expense approval' }, { status });
  }
}
