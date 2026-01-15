import { HealthService } from "./services/health";
import { PlayerService } from "./services/players";
import { TeamService } from "./services/team";

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

const teamService = new TeamService();
const healthService = new HealthService();
const playerService = new PlayerService();

const logTeams = async () => {
  try {
    const teams = await teamService.getTeams();
    console.log("Teams:", teams);
  } catch (error) {
    console.error("Failed to load teams:", error);
  }
};

void logTeams();

const logHealth = async () => {
  try {
    const health = await healthService.getHealth();
    console.log("Health:", health);
  } catch (error) {
    console.error("Failed to load health:", error);
  }
};

void logHealth();

const logPlayers = async () => {
  try {
    const players = await playerService.getPlayers();
    console.log("Players:", players);
  } catch (error) {
    console.error("Failed to load players:", error);
  }
};

void logPlayers();

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    newModule?.render();
  });
}