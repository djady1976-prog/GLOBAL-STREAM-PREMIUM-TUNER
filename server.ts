import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import https from 'https';
import http from 'http';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. API proxy route for secure cross-origin streaming and mixed content bypass
  app.get('/api/proxy-stream', (req, res) => {
    const streamUrl = req.query.url as string;
    if (!streamUrl) {
      return res.status(400).send('URL is required');
    }

    // Helper to proxy stream with redirection, SSL bypass and proper header forwarding
    function pipeStream(url: string, depth = 0) {
      if (depth > 5) {
        return res.status(500).send('Too many redirects');
      }

      try {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const requestModule = isHttps ? https : http;

        const requestOptions = {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Icy-MetaData': '0',
            'Connection': 'keep-alive',
            'Host': parsedUrl.hostname
          },
          // Bypass SSL/TLS expired/invalid certification errors on Romanian broadcast servers
          rejectUnauthorized: false
        };

        const proxyReq = requestModule.request(requestOptions, (proxyRes: any) => {
          // Handle redirects (e.g. 301, 302, 307, 308)
          if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            let redirectUrl = proxyRes.headers.location;
            if (!redirectUrl.startsWith('http')) {
              redirectUrl = new URL(redirectUrl, url).href;
            }

            try {
              const redirectUrlParsed = new URL(redirectUrl);
              // Handle internal non-FQDN hostnames returned by load balancers / Icecast servers (e.g., icepe9)
              if (!redirectUrlParsed.hostname.includes('.') && redirectUrlParsed.hostname !== 'localhost') {
                const sourceUrlParsed = new URL(url);
                console.log(`[PROXY REDIRECT FIX] Internal hostname detected: ${redirectUrlParsed.hostname}. Rewriting to original public host: ${sourceUrlParsed.hostname}`);
                redirectUrlParsed.hostname = sourceUrlParsed.hostname;
                if (sourceUrlParsed.protocol === 'https:') {
                  redirectUrlParsed.protocol = 'https:';
                }
                redirectUrl = redirectUrlParsed.href;
              }
            } catch (pErr: any) {
              console.warn('[PROXY REDIRECT ERROR] Failed to parse/check redirect url:', pErr.message);
            }

            console.log(`[PROXY REDIRECT] Following stream from ${url} to ${redirectUrl}`);
            pipeStream(redirectUrl, depth + 1);
            return;
          }

          // Forward status code and content-type headers
          const contentType = proxyRes.headers['content-type'];
          res.setHeader('Content-Type', contentType || 'audio/mpeg');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.setHeader('Transfer-Encoding', 'chunked');
          res.setHeader('X-Accel-Buffering', 'no');

          // Disable Nagle's algorithm to allow instant low-latency streaming chunk transmission
          if (proxyRes.socket) {
            proxyRes.socket.setNoDelay(true);
          }
          if (res.socket) {
            res.socket.setNoDelay(true);
          }

          // Pipe the stream block-by-block directly to the browser
          proxyRes.pipe(res);

          // Handle client disconnecting (closing page, stopping player)
          req.on('close', () => {
            try {
              proxyRes.destroy();
              proxyReq.destroy();
            } catch (err) {
              // Ignore
            }
          });
        });

        proxyReq.on('error', (err: any) => {
          console.error(`[PROXY ERROR] Direct link failed for ${url}:`, err.message);
          
          // Fallback to plain HTTP if HTTPS fails (important for custom shoutcast/icecast ports which often do not support SSL)
          if (url.startsWith('https://') && !res.headersSent) {
            const fallbackUrl = url.replace(/^https:\/\//i, 'http://');
            console.log(`[PROXY FALLBACK] Retrying with plain HTTP fallback: ${fallbackUrl}`);
            pipeStream(fallbackUrl, depth);
            return;
          }

          if (!res.headersSent) {
            res.status(502).send('Streaming server connection failed');
          }
        });

        proxyReq.setTimeout(10000, () => {
          console.log(`[PROXY TIMEOUT] Connection stalled for ${url}`);
          proxyReq.destroy();
        });

        proxyReq.end();
      } catch (err: any) {
        console.error('[PROXY EXCEPTION] Malformed link or failure:', err.message);
        if (!res.headersSent) {
          res.status(400).send('Malformed Stream Link');
        }
      }
    }

    pipeStream(streamUrl);
  });

  // 2. Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // 3. Vite development vs Production asset routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STREAMING SERVER] Sintonizator server running on http://localhost:${PORT}`);
  });
}

startServer();
