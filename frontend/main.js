const RENDER_URL = 'https://bean-and-brew-api.onrender.com';


const API_BASE = location.hostname.endsWith('.netlify.app')
  ? RENDER_URL
  : location.port === '5500'
    ? 'http://localhost:3000'
    : '';

const list = document.querySelector('#menu-list');
const form = document.querySelector('#item-form');
const message = document.querySelector('#message');
const count = document.querySelector('#menu-count');
const inspectOutput = document.querySelector('#inspect-output');

class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `Request failed (${status})`);
    this.status = status;
    this.details = body?.error?.details;
  }
}


const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, options);
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, body);
  return body;
};

const NETWORK_ERROR = 'Could not reach the server. It may be waking up; try again in a minute.';

const showMessage = (text, tone = '') => {
  message.textContent = text;
  message.className = `message ${tone}`.trim();
};

const errorText = (err) => {
  if (!(err instanceof ApiError)) return NETWORK_ERROR;
  return err.details ? err.details.join(' ') : err.message;
};

const makeButton = (label, className, onClick) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn btn-ghost ${className}`.trim();
  button.textContent = label;
  button.addEventListener('click', () => onClick(button));
  return button;
};

const renderItems = (items) => {
  list.replaceChildren();
  count.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'The menu is empty. Add something tasty.';
    list.append(empty);
    return;
  }

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'card';

    const top = document.createElement('div');
    top.className = 'card-top';
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = item.category;
    const status = document.createElement('span');
    status.className = `status ${item.available ? 'on' : 'off'}`;
    status.textContent = item.available ? 'Available' : 'Sold out';
    top.append(tag, status);

    const title = document.createElement('h3');
    title.textContent = item.name;

    const meta = document.createElement('p');
    meta.className = 'meta';
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `$${item.price.toFixed(2)}`;
    const caffeine = document.createElement('span');
    caffeine.textContent = `${item.caffeineMg} mg caffeine`;
    meta.append(price, caffeine);

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.append(
      makeButton('Inspect', '', (button) => inspectItem(item.id, button)),
      makeButton('Delete', 'btn-danger', (button) => deleteItem(item.id, button)),
    );

    li.append(top, title, meta, actions);
    list.append(li);
  }
};

const loadItems = async () => {
  try {
    const { data } = await apiRequest('/api/items');
    renderItems(data);
  } catch (err) {
    count.textContent = '';
    showMessage(errorText(err), 'error');
  }
};

const inspectItem = async (id, button) => {
  button.disabled = true;
  try {
    const body = await apiRequest(`/api/items/${id}`);
    inspectOutput.textContent = JSON.stringify(body, null, 2);
  } catch (err) {
    inspectOutput.textContent = err instanceof ApiError
      ? JSON.stringify({ error: { status: err.status, message: err.message } }, null, 2)
      : NETWORK_ERROR;
  } finally {
    button.disabled = false;
  }
};

const deleteItem = async (id, button) => {
  button.disabled = true;
  try {
    await apiRequest(`/api/items/${id}`, { method: 'DELETE' });
    showMessage('Item removed.', 'success');
    await loadItems();
  } catch (err) {
    showMessage(errorText(err), 'error');
  } finally {
    if (button.isConnected) button.disabled = false; 
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true; 
  const fd = new FormData(form);
  const payload = {
    name: fd.get('name'),
    category: fd.get('category'),
    price: Number(fd.get('price')),
    caffeineMg: Number(fd.get('caffeineMg')),
    available: fd.get('available') === 'on',
  };
  try {
    await apiRequest('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    showMessage('Added to the menu.', 'success');
    form.reset();
    await loadItems();
  } catch (err) {
    showMessage(errorText(err), 'error');
  } finally {
    submit.disabled = false;
  }
});

loadItems();
