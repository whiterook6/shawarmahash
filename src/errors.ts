import {
  FastifyError,
  FastifyReply,
  FastifyRequest,
  FastifySchemaValidationError,
} from "fastify";

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
      validationErrors: this.validationErrors,
    };
  }
}

// Type guard to check if error is a ValidationError
function isValidationError(error: Error): error is ValidationError {
  return error instanceof ValidationError || error.name === "ValidationError";
}

// Type guard to check if error is a FastifyError with validation
function isFastifyValidationError(error: Error): error is FastifyError & {
  validation: FastifySchemaValidationError[];
} {
  return (
    "validation" in error && Array.isArray((error as FastifyError).validation)
  );
}

export const errorHandler = (
  error: Error,
  _: FastifyRequest,
  reply: FastifyReply,
) => {
  // Handle custom ValidationError
  if (isValidationError(error)) {
    return reply.status(400).send(error.toJSON());
  }
  // Handle Fastify validation errors
  else if (isFastifyValidationError(error)) {
    return reply.status(400).send({
      error: "Validation error",
      validationErrors: error.validation.reduce(
        (acc: Record<string, string[]>, cur: FastifySchemaValidationError) => {
          const key = cur.instancePath.substring(1);
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(cur.message ?? "Unknown error");
          return acc;
        },
        {},
      ),
    });
  } else {
    console.error(error);
    return reply.status(500).send({
      error: "Internal server error",
    });
  }
};
