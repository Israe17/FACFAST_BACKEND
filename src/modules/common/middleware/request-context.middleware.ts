import { randomUUID } from 'crypto';
import { NextFunction, Response } from 'express';
import { RequestWithContext } from '../interfaces/request-context.interface';

export function request_context_middleware(
  request: RequestWithContext,
  response: Response,
  next: NextFunction,
): void {
  const incoming_request_id = request.headers['x-request-id'];
  const request_id = Array.isArray(incoming_request_id)
    ? incoming_request_id[0]
    : incoming_request_id || randomUUID();

  request.request_id = request_id;
  response.setHeader('x-request-id', request_id);
  next();
}
