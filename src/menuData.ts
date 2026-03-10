export type Category = 'pasta' | 'salsa';
export type Unit = 'kg' | 'ud';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  unit: Unit;
  step: number;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'noquis-rellenos-rucula',    name: 'Ñoquis Rellenos', description: 'Masa de rúcula y semillas',             price: 800, category: 'pasta', unit: 'kg', step: 0.5 },
  { id: 'noquis-rellenos-espinaca',  name: 'Ñoquis Rellenos', description: 'Masa de espinaca',                      price: 800, category: 'pasta', unit: 'kg', step: 0.5 },
  { id: 'noquis-clasicos-parmesano', name: 'Ñoquis Clásicos', description: 'Parmesano',                             price: 600, category: 'pasta', unit: 'kg', step: 0.5 },
  { id: 'noquis-clasicos-puerro',    name: 'Ñoquis Clásicos', description: 'Puerro y nuez',                         price: 600, category: 'pasta', unit: 'kg', step: 0.5 },
  { id: 'noquis-clasicos-limon',     name: 'Ñoquis Clásicos', description: 'Limón y jengibre',                      price: 600, category: 'pasta', unit: 'kg', step: 0.5 },
  { id: 'noquis-clasicos-morron',    name: 'Ñoquis Clásicos', description: 'Morrón asado',                          price: 600, category: 'pasta', unit: 'kg', step: 0.5 },
  { id: 'raviolones-ricota',         name: 'Raviolones',      description: 'Ricota, espinaca y nuez',               price: 400, category: 'pasta', unit: 'kg', step: 0.5 },
  { id: 'raviolones-berenjena',      name: 'Raviolones',      description: 'Berenjena, tomates secos y albahaca',   price: 400, category: 'pasta', unit: 'kg', step: 0.5 },
  { id: 'salsa-tomates',             name: 'Tomates asados',  description: '',                                      price: 250, category: 'salsa', unit: 'ud', step: 1 },
  { id: 'salsa-morron',              name: 'Crema de morrón', description: '',                                      price: 280, category: 'salsa', unit: 'ud', step: 1 },
  { id: 'salsa-parmesano',           name: 'Crema de parmesano', description: '',                                   price: 320, category: 'salsa', unit: 'ud', step: 1 },
];

export interface MenuGroup {
  name: string;
  price: number;
  items: MenuItem[];
}

export function getPastaGroups(): MenuGroup[] {
  const map = new Map<string, MenuGroup>();
  MENU_ITEMS.filter(i => i.category === 'pasta').forEach(item => {
    if (!map.has(item.name)) map.set(item.name, { name: item.name, price: item.price, items: [] });
    map.get(item.name)!.items.push(item);
  });
  return Array.from(map.values());
}

export function getSalsas(): MenuItem[] {
  return MENU_ITEMS.filter(i => i.category === 'salsa');
}
