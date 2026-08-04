import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';
import { CategoryType } from '@/types';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tripId, title, amount, category, paidById, splitBetween, receiptUrl } = await request.json();

    if (!tripId || !title || !amount || amount <= 0 || !paidById || !splitBetween || splitBetween.length === 0) {
      return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 });
    }

    const expense = await dbStore.addExpense(
      tripId,
      title.trim(),
      parseFloat(amount),
      (category as CategoryType) || 'Miscellaneous',
      paidById,
      user.id, // createdById for security ownership
      splitBetween,
      receiptUrl
    );

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/expenses POST error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to add expense' }, { status: 400 });
  }
}
