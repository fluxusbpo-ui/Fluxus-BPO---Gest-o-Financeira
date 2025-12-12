const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

// Config
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const PORT = process.env.FRONTEND_PORT ? Number(process.env.FRONTEND_PORT) : 3001;
const TIMEOUT_MS = process.env.FRONTEND_START_TIMEOUT ? Number(process.env.FRONTEND_START_TIMEOUT) : 20000; // default 20s
const POLL_INTERVAL_MS = 500;

console.log(`Starting frontend (Vite) in ${FRONTEND_DIR} and waiting for port ${PORT} (timeout ${TIMEOUT_MS}ms)`);

const fs = require('fs');

// Try to run Vite directly using the local node binary (avoids needing `npm` in PATH).
let child;
function spawnVite() {
  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  if (fs.existsSync(viteBin)) {
    // Use the same Node executable that runs this script
    const nodeExec = process.execPath;
    child = spawn(nodeExec, [viteBin, `--port=${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false, cwd: FRONTEND_DIR });
    return true;
  }
  return false;
}

function spawnFallbackNpm() {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  child = spawn(npmCmd, ['--prefix', FRONTEND_DIR, 'run', 'dev', '--', `--port=${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false });
}

if (!spawnVite()) {
  // vite binary not present (maybe deps not installed) — fallback to npm-based start
  spawnFallbackNpm();
}

if (!child) {
  console.error('Failed to start frontend: no child process created. Ensure dependencies are installed in the frontend folder.');
  process.exit(1);
}

child.stdout.on('data', (d) => process.stdout.write(d));
child.stderr.on('data', (d) => process.stderr.write(d));

child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Frontend process exited with code ${code} signal ${signal}`);
    process.exit(code || 1);
  }
});

let elapsed = 0;
const interval = setInterval(() => {
  const socket = net.createConnection({ port: PORT, host: '127.0.0.1' }, () => {
    console.log(`Port ${PORT} is open — frontend should be ready.`);
    clearInterval(interval);
    socket.end();
    // Do not kill child; let it keep running. Exit this helper with success code.
    process.exit(0);
  });

  socket.on('error', () => {
    // not open yet
    socket.destroy();
    elapsed += POLL_INTERVAL_MS;
    if (elapsed >= TIMEOUT_MS) {
      clearInterval(interval);
      console.error(`Timeout (${TIMEOUT_MS}ms) waiting for port ${PORT}. Killing frontend process.`);
      try { child.kill(); } catch (e) { /* ignore */ }
      process.exit(1);
    }
  });
}, POLL_INTERVAL_MS);
