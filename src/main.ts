import App from "@core/App";

import DefaultProject from "~/default";

const app = new App();
const project = new DefaultProject();
app.loadProject(project);
