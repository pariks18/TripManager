import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';
import { CategoryType } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: { expenseId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, amount, category, paidById, splitBetween } = await request.json();

    if (!title || !amount || amount <= 0 || !paidById || !splitBetween || splitBetween.length === 0) {
      return NextResponse.json({ error: 'Invalid expense payload' }, { status: 400 });
    }

    const updatedExpense = await dbStore.updateExpense(
      params.expenseId,
      user.id, // Current authenticated user ID for ownership security check
      title.trim(),
      parseFloat(amount),
      (category as CategoryType) || 'Miscellaneous',
      paidById,
      splitBetween
    );

    return NextResponse.json({ expense: updatedExpense });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update expense' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { expenseId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await dbStore.deleteExpense(params.expenseId, user.id);
    if (!success) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Expense deleted' });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to delete expense' }, { status });
  }
}
