import { Hono } from "hono";
import chatHistoryRouter from "./chat-history";
import userRouter from "./user";
import messRouter from "./mess";

const router = new Hono();

// Mount các router con
router.route("/chat-history", chatHistoryRouter);
router.route("/user", userRouter);
router.route("/mess", messRouter);

export default router;
