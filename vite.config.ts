import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'local-solana-action',
    configureServer(server) {
      server.middlewares.use('/api/pay', async (req, res) => {
        try {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 4096) { res.statusCode = 413; res.end('Request too large'); return; }
            chunks.push(Buffer.from(chunk));
          }
          const module = await server.ssrLoadModule('/api/pay.ts');
          const address = server.httpServer?.address();
          const port = address && typeof address === 'object' ? address.port : server.config.server.port || 5173;
          const handler = module.createActionHandler(undefined, `http://127.0.0.1:${port}`);
          const response = {
            setHeader: (name: string, value: string) => { res.setHeader(name, value); },
            status: (code: number) => { res.statusCode = code; return response; },
            json: (value: unknown) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); },
            end: () => { res.end(); },
          };
          await handler({ method: req.method, url: `/api/pay${req.url}`, body: chunks.length ? Buffer.concat(chunks).toString() : undefined }, response);
        } catch { res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ message: 'The local Action endpoint could not respond. Try again.' })); }
      });
    },
  }],
  resolve: { alias: [{ find: /^buffer$/, replacement: 'buffer/' }] },
  build: { sourcemap: false },
});
