import { NotFoundException } from "@nestjs/common";
import { Socket } from "socket.io";

export const getActiveRoom = (client: Socket) => {
    const room = Array.from(client.rooms.values()).find((r) => r !== client.id);
    
    if (!room) {
        throw new NotFoundException(`No room found for client ${client.id}`);
    }

    return room
}