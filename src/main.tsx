import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";
import "./i18n";
import { initDatabase } from "./db/indexedDb";

registerSW({ immediate: true });

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

void initDatabase()
  .catch(() => {
    localStorage.setItem("jk-db-reset", "true");
  })
  .finally(() => {
    renderApp();
  });
