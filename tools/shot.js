// Screenshot the laptop slider through CDP at true device sizes.
//   node tools/shot.js <outPrefix> <W> <H> <slideIndex> <t0,t1,t2...>   (times in seconds from slide start)
// Own Chrome profile + port, so Gemini Studio's Chrome is untouched.
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const [out = '_shots/x', W = '390', H = '844', SLIDE = '1', TIMES = '2,5,8,11'] = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const RUN = Date.now().toString(36);                       // fresh port + profile per run: a stale
const PORT = 9400 + (process.pid % 400), PROFILE = path.join(os.tmpdir(), 'laptop-slider-cdp-' + RUN);  // browser used to answer /json with dead targets
const root = path.resolve(__dirname, '..');
const LIVE = process.env.LIVE_URL;                        // LIVE_URL=... shoots the deployed page instead
const url = (LIVE || 'file:///' + path.join(root, 'index.html').split(String.fromCharCode(92)).join('/')) + '?cb=' + Date.now() + '#s' + SLIDE;
const sleep = ms => new Promise(r => setTimeout(r, ms));
setTimeout(() => { console.error('watchdog: giving up'); process.exit(1); }, 90e3).unref();

(async () => {
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch {} }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let n = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pending[m.id]) { pending[m.id](m.result || m.error); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { pending[++n] = r; ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: +W < 700 ? 2 : 1, mobile: +W < 700 });
  await send('Page.navigate', { url });
  await sleep(1800);           // fonts + first paint; slide timeline starts about here
  const t0 = Date.now();
  for (const t of TIMES.split(',').map(Number)) {
    const wait = t * 1000 - (Date.now() - t0);
    if (wait > 0) await sleep(wait);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const f = path.join(root, `${out}-${t}s.png`);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, Buffer.from(shot.data, 'base64'));
    console.log('saved', path.relative(root, f));
  }
  ws.close(); ch.kill();          // Browser.close never answers, so do not await it
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
