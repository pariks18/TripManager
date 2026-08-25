import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MessageDetail } from '@/types';
import { addSubscriber, removeSubscriber } from '@/lib/chatStream';

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { tripId } = params;

  // Verify trip membership
  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: user.id } },
  });
  if (!member) {
    return new NextResponse('Forbidden: Not a member of this trip', { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (message: MessageDetail) => {
        try {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (err) {
          console.error('SSE enqueue error:', err);
        }
      };

      addSubscriber(tripId, send);

      // Send initial connection comment
      controller.enqueue(encoder.encode(': connected\n\n'));

      request.signal.addEventListener('abort', () => {
        removeSubscriber(tripId, send);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
