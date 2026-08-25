import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import { dbStore } from '@/lib/dbStore';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketServerResponse extends NextApiResponse {
  socket: NetSocket & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
}

export default function ioHandler(req: NextApiRequest, res: SocketServerResponse) {
  if (!res.socket.server.io) {
    console.log('* Initializing Socket.IO server on Next.js HTTP server...');
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      socket.on('join_trip', (tripId: string) => {
        if (!tripId) return;
        socket.join(`trip:${tripId}`);
      });

      socket.on('send_message', async ({ tripId, senderId, message }: { tripId: string; senderId: string; message: string }) => {
        if (!tripId || !senderId || !message || !message.trim()) return;

        try {
          // Save to database
          const savedMsg = await dbStore.saveTripMessage(tripId, senderId, message);

          // Broadcast to trip room
          io.to(`trip:${tripId}`).emit('new_message', savedMsg);
        } catch (err: any) {
          console.error('Socket send_message error:', err.message || err);
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
