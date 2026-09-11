import { spawn } from 'node:child_process';
import { platform } from 'node:process';

// Both wrangler and vite bind their own interactive keypress handling
// (hotkeys, raw-mode input) whenever stdin is a TTY. Inheriting stdin into
// both children at once makes them fight over it, which can swallow Ctrl+C
// before it ever reaches this process. Give them stdout/stderr only, so
// Ctrl+C on the terminal always reaches our own SIGINT handler below.
//
// `wrangler dev` also spawns further processes (workerd, an esbuild
// service) as descendants, not direct children of this script. Killing
// only the top-level process leaves those running. On POSIX, detach each
// child into its own process group so `kill(-pid)` reaches the whole tree;
// on Windows, `taskkill /T` walks the recorded parent-process chain instead.
const isWindows = platform === 'win32';

function launch(args) {
  return spawn(process.execPath, args, { stdio: ['ignore', 'inherit', 'inherit'], detached: !isWindows });
}

const children = [
  launch(['node_modules/wrangler/bin/wrangler.js', 'dev', '--port', '8788', '--ip', '127.0.0.1']),
  launch(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--strictPort']),
];

function killTree(child) {
  if (child.exitCode !== null || child.killed) return;
  if (isWindows) spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
  else { try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); } }
}

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) killTree(child);
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
for (const child of children) {
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => stop(code ?? 0));
}
