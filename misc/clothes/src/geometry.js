export function createCloth(n, pin = 'corners') {
  const particles = new Float32Array(n * n * 8);
  const adjacency = new Uint32Array(n * n * 16).fill(0xffffffff);
  const degree = new Uint8Array(n * n), edges = [], triangles = [], lookup = new Map();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    const fixed = y === 0 && (pin === 'top' || pin === 'corners' && (x === 0 || x === n - 1));
    const p = [(x / (n - 1) - .5) * 4, 3.1 - y / (n - 1) * 3, fixed ? 0 : .06 * Math.sin(x * .55) * y / (n - 1), fixed ? 0 : 1];
    particles.set([...p, ...p], i * 8);
  }
  function edge(a, b, rest) {
    const e = edges.length / 4;
    edges.push(a, b, rest, 1);
    lookup.set(`${Math.min(a, b)},${Math.max(a, b)}`, e);
    for (const [v, neighbor] of [[a, b], [b, a]]) {
      const offset = v * 16 + degree[v]++ * 2;
      adjacency[offset] = neighbor; adjacency[offset + 1] = e;
    }
  }
  const dx = 4 / (n - 1), dy = 3 / (n - 1);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    if (x + 1 < n) edge(i, i + 1, dx);
    if (y + 1 < n) edge(i, i + n, dy);
    if (x + 1 < n && y + 1 < n) { edge(i, i + n + 1, Math.hypot(dx, dy)); edge(i + 1, i + n, Math.hypot(dx, dy)); }
  }
  function tri(a, b, c) { triangles.push(a, b, c, ...[[a,b],[b,c],[c,a]].map(([u,v]) => lookup.get(`${Math.min(u,v)},${Math.max(u,v)}`)), 0, 0); }
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const i = y * n + x; tri(i, i+n, i+1); tri(i+1, i+n, i+n+1); }
  const edgeData = new ArrayBuffer(edges.length * 4), u = new Uint32Array(edgeData), f = new Float32Array(edgeData);
  for (let i = 0; i < edges.length; i += 4) { u[i] = edges[i]; u[i+1] = edges[i+1]; f[i+2] = edges[i+2]; u[i+3] = 1; }
  return { particles, adjacency, edges: edgeData, triangles: new Uint32Array(triangles), count: n*n, edgeCount: edges.length/4, triangleCount: triangles.length/8 };
}
export const sub = (a,b) => a.map((v,i) => v-b[i]);
export const dot = (a,b) => a.reduce((s,v,i) => s+v*b[i],0);
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm = a => { const l=Math.hypot(...a)||1; return a.map(v=>v/l); };
export function multiply(a,b) { const m=new Float32Array(16); for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) m[c*4+r]+=a[k*4+r]*b[c*4+k]; return m; }
export function cameraMatrix(eye,target,aspect) {
  const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);
  const v=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  const f=1/Math.tan(Math.PI/8), near=.1,far=100;
  const p=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,far/(near-far),-1,0,0,far*near/(near-far),0]);
  return { matrix:multiply(p,v),right:x,up:y,forward:z,f };
}
export function project(p,m) { const r=[0,0,0,0]; for(let i=0;i<4;i++) r[i]=m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]; return r.map(v=>v/r[3]); }
