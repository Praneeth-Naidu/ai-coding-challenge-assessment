import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../domain/errors.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'The request is invalid.', details: error.issues.map((issue) => ({
        path: issue.path.join('.'), message: issue.message
      })) }
    });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (typeof error === 'object' && error !== null && 'status' in error && error.status === 400) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body must be valid JSON.' } });
    return;
  }
  if (typeof error === 'object' && error !== null && 'status' in error && error.status === 413) {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
};
