export interface MockDb {
  proxy: unknown;
  queue: unknown[];
}

export function createDbMock(results: unknown[] = []): {
  db: any;
  push: (...values: unknown[]) => void;
} {
  const queue = [...results];
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (value: unknown) => void) => resolve(queue.shift());
      }
      if (prop === 'transaction') {
        return (cb: (tx: unknown) => unknown) => cb(proxy);
      }
      return () => proxy;
    },
    apply() {
      return proxy;
    },
  };
  const proxy: any = new Proxy(function () {}, handler);
  return {
    db: proxy,
    push: (...values: unknown[]) => queue.push(...values),
  };
}
