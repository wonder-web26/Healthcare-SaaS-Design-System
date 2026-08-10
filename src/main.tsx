
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  /* Betreuungsrhythmen des Startbestands. Seiteneffekt-Import, weil es ein
     Seed ist: er läuft einmal beim Start, nicht bei jedem Rendern. */
  import "./lib/rhythmus/seed";

  createRoot(document.getElementById("root")!).render(<App />);
  