import App from "./core/App";
import DefaultProject from "./projects/default";

const app = new App();
const project = new DefaultProject();
app.loadProject(project);
