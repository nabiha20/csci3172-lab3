import { Router } from 'express';
import { menu, getNextId } from '../data/menu.js';
import { validateItem } from '../middleware/validateItem.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();


const parseId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, 'id must be a positive whole number.');
  }
  return id;
};

const findIndexOrThrow = (id) => {
  const index = menu.findIndex((item) => item.id === id);
  if (index === -1) throw new HttpError(404, `Menu item ${id} not found.`);
  return index;
};

router.get('/', (req, res) => {
  res.json({ count: menu.length, data: menu });
});

router.get('/:id', (req, res) => {
  const index = findIndexOrThrow(parseId(req.params.id));
  res.json({ data: menu[index] });
});

router.post('/', validateItem, (req, res) => {
  const item = { id: getNextId(), ...req.body };
  menu.push(item);
  res.status(201).location(`/api/items/${item.id}`).json({ data: item });
});

router.delete('/:id', (req, res) => {
  const index = findIndexOrThrow(parseId(req.params.id));
  const [removed] = menu.splice(index, 1);
  res.json({ data: removed });
});

export default router;
