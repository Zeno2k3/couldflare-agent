import { Hono } from "hono";
import { cors } from "hono/cors";
import router from "./router";

const app = new Hono<{ Bindings: CloudflareBindings }>();
app.use('/*', cors());

app.route("/", router);

export default app;