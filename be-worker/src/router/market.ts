import { Hono } from "hono";

const routerMarket = new Hono<{ Bindings: Env }>();

routerMarket.get('/', async (c) => {
 try {
  const { results } = await c.env.db.prepare("SELECT * FROM market_data ORDER BY price DESC").all();
  return c.json({ data: results }, 200);
 } catch (error) {
  return c.json({ error: error }, 500);
 }
});

export default routerMarket;
