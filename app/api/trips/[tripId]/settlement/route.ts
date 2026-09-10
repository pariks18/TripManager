import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';
import { computeSettlements, calculateMemberBalances } from '@/lib/settlement';
import { SettlementRecordDetail } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trip = await dbStore.getTripById(params.tripId, user.id);
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const isHost = trip.createdById === user.id || trip.members.some((m) => m.userId === user.id && m.role === 'ADMIN');
  const balances = calculateMemberBalances(trip.members, trip.expenses, trip.settlementRecords);
  const allSettlements = computeSettlements(trip.members, trip.expenses, trip.settlementRecords);

  // For Hosts/Admins, return full trip matrix; for regular members, filter to user-involved records.
  const userSettlements = isHost
    ? allSettlements
    : allSettlements.filter((tx) => tx.fromUser.id === user.id || tx.toUser.id === user.id);

  const userRecords = isHost
    ? trip.settlementRecords || []
    : (trip.settlementRecords || []).filter((r) => r.fromUserId === user.id || r.toUserId === user.id);

  const userBalances = isHost
    ? balances
    : balances.filter((b) => b.user.id === user.id);

  return NextResponse.json({
    tripId: trip.id,
    currency: trip.currency,
    balances: userBalances,
    settlements: userSettlements,
    records: userRecords,
  });
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
    const { fromUserId, toUserId, amount, status, note } = await request.json();

    if (!fromUserId || !toUserId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid settlement payload' }, { status: 400 });
    }

    const record = await dbStore.createOrUpdateSettlement(
      params.tripId,
      fromUserId,
      toUserId,
      amount,
      (status as SettlementRecordDetail['status']) || 'PENDING',
      note
    );

    return NextResponse.json({ record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settlement' }, { status: 400 });
  }
}
