import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

interface Message {
  message: string;
  clientId: string;
  letterName: string;
  date: Date;
}

interface ClientInfo {
  clientId: string;
  letterName: string;
  connected: boolean;
}

@WebSocketGateway({
  cors: {
    origin: ['https://socialspark-fe.vercel.app', 'http://localhost:3001'],
    methods: ["GET", "POST"],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  public messages: Message[] = [];
  public clients = new Map<string, ClientInfo>();

  handleConnection(
    client: Socket,
    options?: { clientId?: string; letterName?: string }
  ) {
    options = options || {};
    const clientIdQuery = client.handshake.query.clientId;
    let clientId = Array.isArray(clientIdQuery)
      ? clientIdQuery[0]
      : clientIdQuery;
    clientId = clientId !== null && clientId !== undefined ? clientId : null;
    const letterNameQuery = client.handshake.query.letterName;
    let letterName = Array.isArray(letterNameQuery)
      ? letterNameQuery[0]
      : letterNameQuery;
    letterName =
      letterName !== null && letterName !== undefined && letterName !== ""
        ? letterName.charAt(0).toLowerCase()
        : null;

    let clientInfo: ClientInfo;
    if (clientId === null || clientId === "null") {
      clientInfo = {
        clientId: client.id,
        letterName: "",
        connected: client.connected,
      };
    } else {
      clientInfo = {
        clientId: clientId,
        letterName: letterName,
        connected: client.connected,
      };
    }
    this.clients.set(clientInfo.clientId, clientInfo);
    client.emit("userInfo", clientInfo);
    client.emit("allMessages", this.messages);
    this.emitAllUsers();
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;

    let clientInfo;
    if (this.clients.has(clientId)) {
      clientInfo = this.clients.get(clientId);
      this.clients.delete(clientId);
    } else {
      const handshakeClientId = client.handshake.query.clientId;
      const finalClientId = Array.isArray(handshakeClientId) ? handshakeClientId[0] : handshakeClientId;

      if (finalClientId && this.clients.has(finalClientId)) {
        clientInfo = this.clients.get(finalClientId);
        this.clients.delete(finalClientId);
      }
    }

    this.emitAllUsers();
  }

  @SubscribeMessage("message")
  handleMessage(client: Socket, message: string): void {
    let clientInfo = this.clients.get(client.id);

    if (!clientInfo) {
      const clientId = client.handshake.query.clientId.toString();
      clientInfo = {
        clientId: clientId,
        letterName: "",
        connected: client.connected,
      };
      this.clients.set(clientId, clientInfo);
      this.emitAllUsers();
    }

    const newMessage: Message = {
      message: message,
      clientId: clientInfo.clientId,
      letterName: clientInfo.letterName,
      date: new Date(),
    };
    this.messages.push(newMessage);
    this.server.emit("message", newMessage);
    this.server.emit("allMessages", this.messages);
  }

  @SubscribeMessage("updateLetterName")
  handleUpdateLetterName(
    @ConnectedSocket() client: Socket,
    @MessageBody() fullName: string
  ) {
    if (!fullName || fullName.trim().length === 0) {
      return;
    }

    const firstLetter = fullName.trim()[0];
    const clientId = client.handshake.query.clientId || client.id;
    const clientInfo = this.clients.get(clientId as string);
    if (clientInfo) {
      clientInfo.letterName = firstLetter;
      this.clients.set(client.id, clientInfo);
      client.emit("userInfo", clientInfo);
      this.emitAllUsers();
    }
  }

  private emitAllUsers() {
    const users = Array.from(this.clients.values());
    this.server.emit("allUsers", users);
  }
}
