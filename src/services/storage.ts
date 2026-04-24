/**
 * Generic localStorage repository.
 * Single point of access for all persistent data.
 * Designed so that swapping to Supabase later only requires
 * changing this file (or providing a parallel implementation),
 * without touching any UI components.
 */

export interface BaseEntity {
  id: string;
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  getAll<T extends BaseEntity>(key: string): T[] {
    return read<T>(key);
  },

  save<T extends BaseEntity>(key: string, data: T[]): void {
    write<T>(key, data);
  },

  addItem<T extends BaseEntity>(key: string, item: T): T {
    const all = read<T>(key);
    all.unshift(item);
    write(key, all);
    return item;
  },

  updateItem<T extends BaseEntity>(
    key: string,
    id: string,
    updates: Partial<T>,
  ): T | null {
    const all = read<T>(key);
    const idx = all.findIndex((it) => it.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    write(key, all);
    return all[idx];
  },

  deleteItem<T extends BaseEntity>(key: string, id: string): boolean {
    const all = read<T>(key);
    const next = all.filter((it) => it.id !== id);
    write(key, next);
    return next.length !== all.length;
  },

  getById<T extends BaseEntity>(key: string, id: string): T | undefined {
    return read<T>(key).find((it) => it.id === id);
  },
};

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}