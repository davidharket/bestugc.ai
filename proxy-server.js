#!/usr/bin/env node

const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({
  target: '***REMOVED***',
  changeOrigin: true,
  secure: false,
  ws: false, // Disable websockets to avoid conflicts
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Cross-Origin-Opener-Policy': 'unsafe-none',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  }
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('[Proxy Error]:', err.message);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: Unable to proxy request to port 3000');
  }
});

// Create the proxy server
const server = http.createServer((req, res) => {
  console.log(`[Port 3003 Proxy] ${req.method} ${req.url} -> ***REMOVED***${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    res.end();
    return;
  }
  
  // Add CORS headers to response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Proxy the request
  proxy.web(req, res);
});

// Start the proxy server on port 3003
const PORT = 3003;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🔄 Port proxy server started on http://127.0.0.1:${PORT}`);
  console.log(`🎯 Forwarding all requests to ***REMOVED***`);
  console.log(`💡 This allows Remotion to access port 3003 while serving content from port 3000`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('[Proxy Server Error]:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.log('Port 3003 is already in use. This might actually be good - Remotion might be running its own server.');
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔴 Proxy server shutting down gracefully...');
  server.close(() => {
    console.log('✅ Proxy server stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔴 Proxy server shutting down gracefully...');
  server.close(() => {
    console.log('✅ Proxy server stopped');
    process.exit(0);
  });
});