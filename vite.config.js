import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'data-api',
      configureServer(server) {
        function makeWriteHandler(filename) {
          return (req, res) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                fs.writeFileSync(path.resolve(process.cwd(), `src/${filename}`), body);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end('{"ok":true}');
              } catch (err) {
                res.statusCode = 500;
                res.end(err.message);
              }
            });
          };
        }
        server.middlewares.use('/api/save-stations', makeWriteHandler('stations.json'));
        server.middlewares.use('/api/save-queries', makeWriteHandler('queries.json'));
      },
    },
  ],
});
