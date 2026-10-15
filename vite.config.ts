import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Plugin tích hợp API trực tiếp vào Vite Dev Server:
// Giúp "npm run dev" tạo phòng & chơi trực tiếp ở local mà không cần mở thêm server riêng!
function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Polyfill cho res.status và res.json trong môi trường Vite dev
        if (!(res as any).status) {
          (res as any).status = function (code: number) {
            this.statusCode = code;
            return this;
          };
        }
        if (!(res as any).json) {
          (res as any).json = function (data: any) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };
        }

        // Đọc body nếu là POST hoặc PUT
        if (req.method === 'POST' || req.method === 'PUT') {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const rawBody = Buffer.concat(buffers).toString('utf-8');
          try {
            (req as any).body = rawBody ? JSON.parse(rawBody) : {};
          } catch {
            (req as any).body = {};
          }
        }

        // Route health check
        if (req.url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
          return;
        }

        // Route API rooms
        if (req.url.startsWith('/api/rooms')) {
          try {
            const { default: handler } = await import('./api/rooms');
            await handler(req, res);
            return;
          } catch (err: any) {
            console.error('Local API error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Lỗi xử lý API nội bộ' }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
