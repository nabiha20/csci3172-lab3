import { HttpError } from '../utils/httpError.js';
import { CATEGORIES } from '../data/menu.js';

const REQUIRED = ['name', 'category', 'price', 'caffeineMg', 'available'];

export const validateItem = (req, res, next) => {
  const body = req.body;

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return next(new HttpError(400, 'Request body must be a single JSON object.'));
  }

  const errors = [];

  for (const field of REQUIRED) {
    if (!Object.hasOwn(body, field)) errors.push(`${field} is required.`);
  }

  const extra = Object.keys(body).filter((key) => !REQUIRED.includes(key));
  if (extra.length > 0) errors.push(`Unexpected field(s): ${extra.join(', ')}.`);

  const { name, category, price, caffeineMg, available } = body;

  if (
    Object.hasOwn(body, 'name') &&
    (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 60)
  ) {
    errors.push('name must be a non-empty string of at most 60 characters.');
  }
  if (
    Object.hasOwn(body, 'category') &&
    (typeof category !== 'string' || !CATEGORIES.includes(category.trim()))
  ) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}.`);
  }
  if (Object.hasOwn(body, 'price') && (!Number.isFinite(price) || price < 0.5 || price > 25)) {
    errors.push('price must be a number between 0.50 and 25.00.');
  }
  if (
    Object.hasOwn(body, 'caffeineMg') &&
    (!Number.isInteger(caffeineMg) || caffeineMg < 0 || caffeineMg > 500)
  ) {
    errors.push('caffeineMg must be a whole number between 0 and 500.');
  }
  if (Object.hasOwn(body, 'available') && typeof available !== 'boolean') {
    errors.push('available must be true or false.');
  }

  if (errors.length > 0) {
    return next(new HttpError(400, 'Validation failed.', errors));
  }

  req.body = {
    name: name.trim(),
    category: category.trim(),
    price: Math.round(price * 100) / 100,
    caffeineMg,
    available,
  };
  next();
};
