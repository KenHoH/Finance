import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket){
    const userId = client.handshake.auth.userId as string | undefined;
    if(userId){
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket){
    const userId = client.handshake.auth.userId as string | undefined;
    if(userId){
      client.leave(`user:${userId}`);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown){
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown){
    userIds.forEach((id) => this.server.to(`user:${id}`).emit(event, payload));
  }
}
