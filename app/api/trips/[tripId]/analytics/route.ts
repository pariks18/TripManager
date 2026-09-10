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
    const trip = await dbStore.getTripById(params.tripId, user.id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or permission denied' }, { status: 404 });
    }

    const isHost =
      trip.createdById === user.id ||
      trip.members.some((m) => m.userId === user.id && m.role === 'ADMIN');

    const analytics = await dbStore.getMemberAnalytics(params.tripId);

    const sanitizedAnalytics = isHost
      ? analytics
      : analytics.map((item) => {
          if (item.user.id === user.id) return item;
          return {
            ...item,
            totalPaid: 0,
            totalOwed: 0,
            netBalance: 0,
          };
        });

    return NextResponse.json({ analytics: sanitizedAnalytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
