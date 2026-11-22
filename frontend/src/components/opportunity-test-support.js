import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

// Cada arquivo de testes roda em um processo isolado do node:test.
export async function componentEnvironment(context) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  const originals = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  // JSDOM não implementa o comportamento visual de diálogos nativos.
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  let vite;
  let cleanup;
  context.after(async () => {
    cleanup?.();
    await vite?.close();
    dom.window.close();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  // React DOM deve ser carregado depois que o documento estiver disponível.
  const testing = await import('@testing-library/react/pure.js');
  cleanup = testing.cleanup;
  const { default: userEvent } = await import('@testing-library/user-event');
  vite = await createServer({ logLevel: 'silent', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  return {
    ...testing, user: userEvent.setup({ document: dom.window.document }),
    load: async (name) => (await vite.ssrLoadModule(`/src/components/${name}.jsx`)).default,
  };
}
