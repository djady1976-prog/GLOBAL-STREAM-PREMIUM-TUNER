import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import https from 'https';
import http from 'http';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. API proxy route for secure cross-origin streaming and mixed content bypass
  app.options('/api/proxy-stream', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.sendStatus(204);
  });

  app.get('/api/proxy-stream', (req, res) => {
    const streamUrl = req.query.url as string;
    if (!streamUrl) {
      return res.status(400).send('URL is required');
    }

    // Helper to proxy stream with redirection, SSL bypass and proper header forwarding
    function pipeStream(url: string, depth = 0) {
      if (depth > 6) {
        if (!res.headersSent) {
          res.status(500).send('Too many redirects');
        }
        return;
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
          },
          insecureHTTPParser: true, // Crucial for Icecast/Shoutcast legacy ICY 200 OK headers
          rejectUnauthorized: false
        };

        let hasResponded = false;

        const proxyReq = requestModule.request(requestOptions, (proxyRes: any) => {
          hasResponded = true;
          // Clear connection timeout once headers arrive so live stream plays continuously!
          proxyReq.setTimeout(0);

          // Handle redirects (301, 302, 303, 307, 308)
          if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            let redirectUrl = proxyRes.headers.location.trim();
            if (!redirectUrl.toLowerCase().startsWith('http://') && !redirectUrl.toLowerCase().startsWith('https://')) {
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

          // Handle 4xx / 5xx error responses with fallback attempts
          if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
            console.warn(`[PROXY WARN] Remote stream ${url} returned status ${proxyRes.statusCode}`);
            if (url.startsWith('https://') && !res.headersSent) {
              const fallbackUrl = url.replace(/^https:\/\//i, 'http://');
              console.log(`[PROXY FALLBACK] Retrying 4xx/5xx with plain HTTP fallback: ${fallbackUrl}`);
              pipeStream(fallbackUrl, depth + 1);
              return;
            }
            if (!res.headersSent) {
              return res.status(proxyRes.statusCode).send(`Remote stream error ${proxyRes.statusCode}`);
            }
            return;
          }

          // Infer appropriate content-type for audio streaming
          let contentType = proxyRes.headers['content-type'] || '';
          if (!contentType || contentType.includes('text/html') || contentType.includes('text/plain')) {
            if (url.includes('.aac')) {
              contentType = 'audio/aac';
            } else if (url.includes('.ogg')) {
              contentType = 'audio/ogg';
            } else {
              contentType = 'audio/mpeg';
            }
          }

          res.setHeader('Content-Type', contentType);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
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
          
          // Fallback to plain HTTP if HTTPS fails
          if (url.startsWith('https://') && !res.headersSent && !hasResponded) {
            const fallbackUrl = url.replace(/^https:\/\//i, 'http://');
            console.log(`[PROXY FALLBACK] Retrying with plain HTTP fallback: ${fallbackUrl}`);
            pipeStream(fallbackUrl, depth + 1);
            return;
          }

          if (!res.headersSent) {
            res.status(502).send('Streaming server connection failed');
          }
        });

        // 15-second initial connection timeout
        proxyReq.setTimeout(15000, () => {
          console.log(`[PROXY TIMEOUT] Connection stalled for ${url}`);
          if (!hasResponded) {
            proxyReq.destroy();
          }
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
