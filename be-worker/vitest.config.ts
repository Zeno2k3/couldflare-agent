import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
 test: {
  // standard vitest options if any
  poolOptions: {
   workers: {
    wrangler: { configPath: './wrangler.test.jsonc' },
   },
  },
 },
});
