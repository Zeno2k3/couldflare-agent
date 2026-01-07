import { Hono } from "hono";
import { cors } from "hono/cors";
import router from "./router";

export const app = new Hono<{ Bindings: Env }>();
app.use('/*', cors());

app.route("/", router);


export default {
      fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
            return app.fetch(request, env, ctx);
      },
      async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
            try {
                  const response = await fetch(
                        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true',
                        {
                              headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                    'Accept': 'application/json',
                                    ...(env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {})
                              }
                        }
                  );

                  if (!response.ok) {
                        throw new Error(`CoinGecko API error: ${response.statusText}`);
                  }

                  const data: any = await response.json();

                  const updates = [
                        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', data: data.bitcoin },
                        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', data: data.ethereum },
                        { id: 'solana', symbol: 'SOL', name: 'Solana', data: data.solana }
                  ];
                  console.log(updates);
                  const stmt = env.db.prepare(
                        `INSERT INTO market_data (id, symbol, name, price, change_24h, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON CONFLICT(id) DO UPDATE SET 
         price = excluded.price, 
         change_24h = excluded.change_24h, 
         updated_at = excluded.updated_at`
                  );

                  const batch = updates.map(item =>
                        stmt.bind(
                              item.id,
                              item.symbol,
                              item.name,
                              item.data.usd,
                              item.data.usd_24h_change,
                              Math.floor(Date.now() / 1000)
                        )
                  );

                  await env.db.batch(batch);
                  console.log('Market data updated successfully');
            } catch (error) {
                  console.error('Failed to update market data:', error);
            }
      }
};