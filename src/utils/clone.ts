import { toRaw } from 'vue';

function cloneValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value === null || typeof value !== 'object') return value;

  const source = toRaw(value);
  const cached = seen.get(source);
  if (cached) return cached;

  if (source instanceof Date) return new Date(source.getTime());

  if (source instanceof Map) {
    const result = new Map();
    seen.set(source, result);
    source.forEach((item, key) => result.set(cloneValue(key, seen), cloneValue(item, seen)));
    return result;
  }

  if (source instanceof Set) {
    const result = new Set();
    seen.set(source, result);
    source.forEach((item) => result.add(cloneValue(item, seen)));
    return result;
  }

  if (Array.isArray(source)) {
    const result: unknown[] = [];
    seen.set(source, result);
    source.forEach((item) => result.push(cloneValue(item, seen)));
    return result;
  }

  const result: Record<PropertyKey, unknown> = {};
  seen.set(source, result);
  Reflect.ownKeys(source).forEach((key) => {
    result[key] = cloneValue(Reflect.get(source, key), seen);
  });
  return result;
}

/** Creates a detached copy of plain application data, including Vue reactive proxies. */
export function cloneData<T>(value: T): T {
  return cloneValue(value, new WeakMap()) as T;
}
