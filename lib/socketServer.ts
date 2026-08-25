import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyJWT } from './auth';
import { dbStore } from './dbStore';
import { prisma } from './prisma';

const TOKEN_NAME = 'tripsplit_auth_token';

function parseCookie(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

export function initSocketServer(io: SocketIOServer) {
  // Authentication middleware
  io.use(async (socket: Socket, next: (err?: Error) => void) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token) {
        const cookies = parseCookie(socket.handshake.headers.cookie);
        token = cookies[TOKEN_NAME];
      }

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const user = await verifyJWT(token);
      if (!user) {
        return next(new Error('Invalid or expired authentication token'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    socket.on('join_trip', async ({ tripId }: { tripId: string }) => {
      try {
        if (!tripId) return;

        // Verify trip membership
        const member = await prisma.tripMember.findUnique({
          where: { tripId_userId: { tripId, userId: user.id } },
        });

        if (!member) {
          socket.emit('message_error', { error: 'Forbidden: You are not a member of this trip' });
          return;
        }

        const roomName = `trip:${tripId}`;
        socket.join(roomName);
        io.to(roomName).emit('user_joined', { userId: user.id, userName: user.name, tripId });
      } catch (error: any) {
        socket.emit('message_error', { error: error.message || 'Failed to join trip chat room' });
      }
    });

    socket.on('leave_trip', ({ tripId }: { tripId: string }) => {
      if (!tripId) return;
      const roomName = `trip:${tripId}`;
      socket.leave(roomName);
      io.to(roomName).emit('user_left', { userId: user.id, userName: user.name, tripId });
    });

    socket.on('send_message', async ({ tripId, content }: { tripId: string; content: string }) => {
      try {
        if (!tripId || !content || typeof content !== 'string' || !content.trim()) {
          socket.emit('message_error', { error: 'Invalid message payload' });
          return;
        }

        // Save message to DB and populate sender info
        const message = await dbStore.saveTripMessage(tripId, user.id, content);

        // Broadcast to room
        const roomName = `trip:${tripId}`;
        io.to(roomName).emit('new_message', message);
      } catch (error: any) {
        socket.emit('message_error', { error: error.message || 'Failed to process message' });
      }
    });

    socket.on('disconnect', () => {
      // Disconnect handling
    });
  });
}
