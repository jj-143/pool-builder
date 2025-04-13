import App from "@core/App";

import PoolBuilder from "~/PoolBuilder";

const app = new App(document.getElementById("container")!, {
  antialias: false,
});
const project = new PoolBuilder();
app.loadProject(project);
