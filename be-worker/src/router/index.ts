import { Hono } from "hono";
import routerChatHistory from "./chat-history";
import routerUser from "./user";
import routerMess from "./mess";
import routerMarket from "./market";

const router = new Hono<{ Bindings: Env }>();

// Mount các router con
router.route("/chat-history", routerChatHistory);
router.route("/user", routerUser);
router.route("/message", routerMess);
router.route("/market", routerMarket);

export default router;
