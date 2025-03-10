import App from "@core/App";

import PoolBuilder from "~/PoolBuilder";

const app = new App(document.getElementById("container")!, {
  stencil: true,
});
const project = new PoolBuilder();
app.loadProject(project);
