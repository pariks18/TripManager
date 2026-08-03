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
    const analytics = await dbStore.getMemberAnalytics(params.tripId);
    return NextResponse.json({ analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
