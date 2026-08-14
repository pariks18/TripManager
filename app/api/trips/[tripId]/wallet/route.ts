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
    const wallet = await dbStore.getOrCreateWallet(params.tripId);
    return NextResponse.json({ wallet });
  } catch (error: any) {
    console.error('[API GET /api/trips/[tripId]/wallet error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch wallet' }, { status: 400 });
  }
}
