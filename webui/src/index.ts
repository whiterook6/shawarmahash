const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

export const render = () => {
  app.innerHTML = `
    <main>
      <h1>Vite + TypeScript</h1>
      <p>HMR is enabled. Hello! Edit <code>webui/src/index.ts</code>.</p>
    </main>
  `;
};

render();

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    newModule?.render();
  });
}