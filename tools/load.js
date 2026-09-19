// What a phone actually waits for on the deployed page: emulate a mid-tier device on 4G,
// then report the paint milestones and every request that took real time.
//   node tools/load.js <url> [W H cpuRate]
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const [URL_ = 'https://digitaldotdeveloper.github.io/laptop-store-slider/', W = '390', H = '844', CPU = '4'] = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const PORT = 9600 + (process.pid % 150), PROFILE = path.join(os.tmpdir(), 'laptop-load-' + Date.now().toString(36));
const sleep = ms => new Promise(r => setTimeout(r, ms));
setTimeout(() => { console.error('watchdog'); process.exit(1); }, 150e3).unref();

(async () => {
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 60 && !t; i++) { await sleep(250); try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch {} }
  const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let n = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pending[m.id]) { pending[m.id](m.result || m.error); delete pending[m.id]; } };
  const send = (m, p = {}) => new Promise(r => { pending[++n] = r; ws.send(JSON.stringify({ id: n, method: m, params: p })); });
  await send('Page.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setCPUThrottlingRate', { rate: +CPU });
  await send('Network.emulateNetworkConditions', { offline: false, latency: 120, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });  // regular 4G
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.navigate', { url: URL_ + '?cb=' + Date.now() });
  await sleep(18000);
  const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(()=>{
    const nav=performance.getEntriesByType('navigation')[0]||{};
    const paint=Object.fromEntries(performance.getEntriesByType('paint').map(p=>[p.name,Math.round(p.startTime)]));
    const res=performance.getEntriesByType('resource').map(e=>({n:e.name.split('/').pop().split('?')[0],s:Math.round(e.startTime),e:Math.round(e.responseEnd),kb:Math.round((e.transferSize||0)/1024)}));
    res.sort((a,b)=>b.e-a.e);
    return JSON.stringify({dom:Math.round(nav.domContentLoadedEventEnd),load:Math.round(nav.loadEventEnd),paint,
      total_kb:Math.round(res.reduce((s,x)=>s+x.kb,0)),count:res.length,
      slowest:res.slice(0,8).map(x=>x.n+' '+x.s+'->'+x.e+'ms '+x.kb+'KB'),
      firstFrameOfAnimation:window.__t0??null});})()` });
  console.log(JSON.parse(r.result.value));
  ws.close(); ch.kill(); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
