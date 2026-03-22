import { MENU_ITEMS, type MenuItem } from './menuData';

/**
 * Fetches the menu items.
 * Currently returns local data as a resolved promise.
 * To connect a real API, replace the body of this function:
 *
 *   const res = await fetch('/api/menu');
 *   return res.json();
 */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  return Promise.resolve(MENU_ITEMS);
}
