import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 自定义轻量级预渲染插件
const simplePrerenderPlugin = () => {
  return {
    name: 'simple-prerender',
    closeBundle: async () => {
      const distPath = path.resolve(__dirname, 'dist');
      const indexPath = path.resolve(distPath, 'index.html');
      
      if (!fs.existsSync(indexPath)) return;

      const template = fs.readFileSync(indexPath, 'utf-8');
      
      // 路由映射与其对应的 SEO 内容 Key (基于 seoContent.ts)
      const routes = [
        { path: 'json-formatter', mode: 'tree', title: 'Professional JSON Formatter & Visual Explorer Online' },
        { path: 'json-builder', mode: 'builder', title: 'Visual JSON Builder & Schema Architect' },
        { path: 'json-tabular', mode: 'table', title: 'JSON to Table Converter - Bulk Data Inspector' },
        { path: 'json-analyzer', mode: 'analysis', title: 'Advanced JSON Analytics & Structural Intelligence' },
        { path: 'json-converter', mode: 'export', title: 'JSON Converter - Export to CSV, YAML, XML & More' }
      ];

      routes.forEach(route => {
        const routeDir = path.resolve(distPath, route.path);
        if (!fs.existsSync(routeDir)) {
          fs.mkdirSync(routeDir, { recursive: true });
        }

        // 简单的正则替换 Meta 信息
        let html = template
          .replace(/<title>.*?<\/title>/, `<title>${route.title} | JSON Morph</title>`)
          .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="Professional developer tool for ${route.path.replace('-', ' ')} with high performance and privacy."`)
          .replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="https://json.open-close.shop/${route.path}" />`);

        // 注入首屏 H1 和隐藏的描述，确保爬虫能抓到
        const seoBodyInject = `
          <div id="seo-content" style="display:none" aria-hidden="true">
            <h1>${route.title}</h1>
            <p>Professional JSON tool suite for architects and developers. Secure, fast, and local processing.</p>
          </div>
        `;
        html = html.replace('<body>', `<body>${seoBodyInject}`);

        fs.writeFileSync(path.resolve(routeDir, 'index.html'), html);
        console.log(`[SimplePrerender] Generated: /${route.path}/index.html`);
      });
    }
  };
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        simplePrerenderPlugin()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
