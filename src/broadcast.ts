import { SSEReplyInterface } from "@fastify/sse";
import { FastifyReply, FastifyRequest } from "fastify";

export class Broadcast {
  private readonly clients: Set<SSEReplyInterface> = new Set<SSEReplyInterface>();
  public addClient(request: FastifyRequest, reply: FastifyReply){
    this.clients.add(reply.sse);
    request.raw.on("close", () => {
      this.clients.delete(reply.sse);
    });
  }

  public broadcast(event: string, data: any){
    for (const client of this.clients){
      client.send({
        event: event,
        data: data
      });
    }
  }

  public close(){
    for (const client of this.clients){
      client.close();
    }
  }
}