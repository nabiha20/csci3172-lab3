import { HttpError } from '../utils/httpError.js';

export const notFound = (req, res, next) => {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} not found.`));
};


export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;
  const details = err.details;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body.';
  }

  if (status >= 500) {
    console.error(err); 
    message = 'Internal server error.';
  }

  const error = { status, message };
  if (details) error.details = details;

  res.status(status).json({ error });
};
