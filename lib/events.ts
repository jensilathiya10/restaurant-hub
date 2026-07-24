type Listener = (data: any) => void;

declare global {
  // eslint-disable-next-line no-var
  var __rhListeners: Map<string, Set<Listener>> | undefined;
}

function store() {
  if (!global.__rhListeners) global.__rhListeners = new Map();
  return global.__rhListeners;
}

export function subscribe(restaurantId: string, fn: Listener) {
  const s = store();
  if (!s.has(restaurantId)) s.set(restaurantId, new Set());
  s.get(restaurantId)!.add(fn);
  return () => {
    s.get(restaurantId)?.delete(fn);
  };
}

export function broadcast(restaurantId: string, data: any) {
  const s = store();
  s.get(restaurantId)?.forEach((fn) => fn(data));
}
