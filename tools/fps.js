// Frame budget on a phone-class CPU: emulate the device, throttle 4x, count rAF frames
// across the whole slide loop (arrive -> boot -> explode -> snap -> dive).
//   node tools/fps.js [W H seconds cpuRate]
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const [W = '390', H = '844', SECS = '14', CPU = '4'] = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const PORT = 9800 + (process.pid % 150), PROFILE = path.join(os.tmpdir(), 'laptop-fps-' + Date.now().toString(36));
const root = path.resolve(__dirname, '..');
const url = 'file:///' + path.join(root, 'index.html').split(String.fromCharCode(92)).join('/') + '?cb=' + Date.now();
const sleep = ms => new Promise(r => setTimeout(r, ms));
setTimeout(() => { console.error('watchdog'); process.exit(1); }, 180e3).unref();

(async () => {
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch {} }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let n = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pending[m.id]) { pending[m.id](m.result || m.error); delete pending[m.id]; } };
  const send = (m, p = {}) => new Promise(r => { pending[++n] = r; ws.send(JSON.stringify({ id: n, method: m, params: p })); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setCPUThrottlingRate', { rate: +CPU });
  await send('Page.navigate', { url });
  await sleep(600);
  await send('Runtime.evaluate', { expression: `window.__f=[];(function L(t){window.__f.push(t);requestAnimationFrame(L)})(0)` });
  await sleep(+SECS * 1000);
  const r = await send('Runtime.evaluate', {
    expression: `(()=>{const f=window.__f,d=[];for(let i=1;i<f.length;i++)d.push(f[i]-f[i-1]);
      d.sort((a,b)=>a-b);const span=f[f.length-1]-f[0];
      return JSON.stringify({frames:f.length,fps:+(f.length/span*1000).toFixed(1),
        median:+d[d.length>>1].toFixed(1),p95:+d[Math.floor(d.length*.95)].toFixed(1),worst:+d[d.length-1].toFixed(1),
        over32ms:d.filter(x=>x>32).length,
        spikes:(()=>{const o=[];for(let i=1;i<f.length;i++){const g=f[i]-f[i-1];if(g>60)o.push(Math.round(f[i-1]-f[0])+'ms:+'+Math.round(g));}return o.slice(0,12);})()});})()`, returnByValue: true });
  console.log(`CPU x${CPU} @ ${W}x${H}:`, r.result.value);
  ws.close(); ch.kill();
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
