// End-to-end test server (npm run e2e):
// - the Market API in dev mode (in-memory Firestore, fake Stripe, AI off,
//   "Bearer dev:<uid>" sign-in) from the backend repo, on :5055;
// - the e2e build (dist/e2e) on :4311, sending /api, /feeds and /p to the
//   API like Firebase Hosting's rewrites do.
// The backend repo is found at MARKET_BACKEND_DIR, else ../../taliferrotech/todd-backend/functions.
import { spawn } from 'node:child_process';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const root = path.resolve( here, '../dist/e2e/browser' );
const backend = path.resolve( process.env.MARKET_BACKEND_DIR || path.resolve( here, '../../../taliferrotech/todd-backend/functions' ) );
const API_PORT = 5055;
const WEB_PORT = 4311;

const api = spawn( process.execPath, ['market/dev/server.js'], { cwd: backend, stdio: 'inherit', env: { ...process.env, PORT: String( API_PORT ), MARKET_PUBLIC_URL: `http://localhost:${ WEB_PORT }` } } );
const stop = () => { api.kill(); process.exit( 0 ); };
process.on( 'SIGINT', stop );
process.on( 'SIGTERM', stop );
api.on( 'exit', ( code ) => { if ( code ) { console.error( `dev API exited (${ code })` ); process.exit( code ); } } );

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml', '.wav': 'audio/wav' };

http.createServer( async ( req, res ) => {
  if ( /^\/(api|feeds|p)\//.test( req.url ) ) {
    const up = http.request( { host: '127.0.0.1', port: API_PORT, path: req.url, method: req.method, headers: req.headers }, ( r ) => { res.writeHead( r.statusCode, r.headers ); r.pipe( res ); } );
    up.on( 'error', () => { res.writeHead( 502 ); res.end(); } );
    req.pipe( up );
    return;
  }
  const p = decodeURIComponent( req.url.split( '?' )[0] );
  for ( const f of [p, path.join( p, 'index.html' )] ) {
    const file = path.join( root, f );
    if ( !file.startsWith( root ) ) break;
    try {
      if ( ( await stat( file ) ).isFile() ) {
        res.writeHead( 200, { 'content-type': types[path.extname( file )] || 'application/octet-stream' } );
        res.end( await readFile( file ) );
        return;
      }
    } catch { /* next */ }
  }
  res.writeHead( 200, { 'content-type': 'text/html' } );
  res.end( await readFile( path.join( root, 'index.csr.html' ) ) );
} ).listen( WEB_PORT, () => console.log( `e2e web on http://localhost:${ WEB_PORT }` ) );
