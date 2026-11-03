import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const postJson = (body) =>
  fetch(`${base}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const validItem = { name: 'Chai', category: 'Tea', price: 4, caffeineMg: 50, available: true };

test('GET /api/items returns the seed menu', async () => {
  const res = await fetch(`${base}/api/items`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.count, 3);
  assert.equal(body.data.length, 3);
});

test('GET /api/items/2 returns the muffin', async () => {
  const res = await fetch(`${base}/api/items/2`);
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.equal(data.name, 'Nova Scotia Blueberry Muffin');
});

test('GET /api/items/99 returns 404', async () => {
  const res = await fetch(`${base}/api/items/99`);
  assert.equal(res.status, 404);
  const { error } = await res.json();
  assert.equal(error.message, 'Menu item 99 not found.');
});

test('GET /api/items/abc returns 400', async () => {
  const res = await fetch(`${base}/api/items/abc`);
  assert.equal(res.status, 400);
});

test('POST creates an item with 201 and Location', async () => {
  const res = await postJson(validItem);
  assert.equal(res.status, 201);
  assert.match(res.headers.get('location'), /^\/api\/items\/\d+$/);
  const { data } = await res.json();
  assert.equal(data.name, 'Chai');
});

test('POST rejects a string price with a details array', async () => {
  const res = await postJson({ ...validItem, price: '5' });
  assert.equal(res.status, 400);
  const { error } = await res.json();
  assert.ok(Array.isArray(error.details));
});

test('POST rejects a missing name', async () => {
  const { name, ...rest } = validItem;
  const res = await postJson(rest);
  assert.equal(res.status, 400);
  const { error } = await res.json();
  assert.ok(error.details.includes('name is required.'));
});

test('POST rejects an array body', async () => {
  const res = await postJson([]);
  assert.equal(res.status, 400);
  const { error } = await res.json();
  assert.equal(error.message, 'Request body must be a single JSON object.');
});

test('POST rejects unexpected fields', async () => {
  const res = await postJson({ ...validItem, id: 42 });
  assert.equal(res.status, 400);
});

test('POST rejects malformed JSON with 400', async () => {
  const res = await postJson('{"name": "Latte",}');
  assert.equal(res.status, 400);
  const { error } = await res.json();
  assert.equal(error.message, 'Malformed JSON in request body.');
});

test('DELETE removes an item, then GET returns 404', async () => {
  const created = await (await postJson(validItem)).json();
  const { id } = created.data;
  const del = await fetch(`${base}/api/items/${id}`, { method: 'DELETE' });
  assert.equal(del.status, 200);
  const after = await fetch(`${base}/api/items/${id}`);
  assert.equal(after.status, 404);
});

test('Unknown route returns 404', async () => {
  const res = await fetch(`${base}/api/nothing`);
  assert.equal(res.status, 404);
});

test('Debug route returns a generic 500', async () => {
  const res = await fetch(`${base}/api/debug/error`);
  assert.equal(res.status, 500);
  const { error } = await res.json();
  assert.equal(error.message, 'Internal server error.');
});
