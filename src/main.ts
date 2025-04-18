import App from "@core/App";

import PoolBuilder from "~/PoolBuilder";

const app = new App(document.getElementById("container")!, {
  antialias: false,
  stencil: false,
  depth: false,
});
const project = new PoolBuilder();
app.loadProject(project);
