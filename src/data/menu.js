export const CATEGORIES = ['Espresso', 'Brewed', 'Tea', 'Bakery'];

export const menu = [
  { id: 1, name: 'Maple Oat Latte', category: 'Espresso', price: 5.75, caffeineMg: 150, available: true },
  { id: 2, name: 'Nova Scotia Blueberry Muffin', category: 'Bakery', price: 3.5, caffeineMg: 0, available: true },
  { id: 3, name: 'Cold Brew', category: 'Brewed', price: 4.25, caffeineMg: 200, available: false },
];

let nextId = 4;
export const getNextId = () => nextId++;