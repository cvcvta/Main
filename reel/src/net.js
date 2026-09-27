// Binary WebSocket back to the Node renderer (frames, stills, baked assets).
let sock = null;
export async function connect() {
  if (sock) return;
  sock = new WebSocket(`ws://${location.host}/`);
  sock.binaryType = 'arraybuffer';
  await new Promise((res, rej) => { sock.onopen = res; sock.onerror = rej; });
}
export function send(tag, px) {
  return new Promise((res, rej) => {
    sock.onmessage = (e) => (String(e.data).startsWith('err') ? rej(new Error(e.data)) : res());
    sock.send(tag);
    sock.send(px);
  });
}
