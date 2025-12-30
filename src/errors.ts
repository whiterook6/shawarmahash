import { FastifyError, FastifyReply, FastifyRequest, FastifySchemaValidationError } from "fastify";

export class ValidationError extends Error {
  validationErrors: Record<string, string[]>;

  constructor(validationErrors: Record<string, string[]>) {
    super();
    this.name = "ValidationError";
    this.validationErrors = validationErrors;
  }

  toJSON() {
    return {
      error: "Validation error",
      validationErrors: this.validationErrors
    };
  }
}

export const errorHandler = (error: FastifyError, _: FastifyRequest, reply: FastifyReply) => {
  if (error.name === "ValidationError") {
    return reply.status(400).send((error as any).toJSON());
  } else if (error.validation) {
    return reply.status(400).send({
      error: "Validation error",
      validationErrors: error.validation.reduce((acc: Record<string, string[]>, cur: FastifySchemaValidationError) => {
        const key = cur.instancePath.substring(1);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(cur.message ?? "Unknown error");
        return acc;
      }, {})
    });
  } else {
    return reply.status(500).send({
      error: "Internal server error"
    });
  }
};