function e(e){return e[0]*(e[4]*e[8]-e[5]*e[7])-e[1]*(e[3]*e[8]-e[5]*e[6])+e[2]*(e[3]*e[7]-e[4]*e[6])}function t(t){let n=e(t);if(Math.abs(n)<1e-10)throw Error(`Degenerate tetrahedron`);let r=1/n;return[(t[4]*t[8]-t[5]*t[7])*r,(t[2]*t[7]-t[1]*t[8])*r,(t[1]*t[5]-t[2]*t[4])*r,(t[5]*t[6]-t[3]*t[8])*r,(t[0]*t[8]-t[2]*t[6])*r,(t[2]*t[3]-t[0]*t[5])*r,(t[3]*t[7]-t[4]*t[6])*r,(t[1]*t[6]-t[0]*t[7])*r,(t[0]*t[4]-t[1]*t[3])*r]}function n(e,t){return[e[0]*t[0]+e[1]*t[3]+e[2]*t[6],e[0]*t[1]+e[1]*t[4]+e[2]*t[7],e[0]*t[2]+e[1]*t[5]+e[2]*t[8],e[3]*t[0]+e[4]*t[3]+e[5]*t[6],e[3]*t[1]+e[4]*t[4]+e[5]*t[7],e[3]*t[2]+e[4]*t[5]+e[5]*t[8],e[6]*t[0]+e[7]*t[3]+e[8]*t[6],e[6]*t[1]+e[7]*t[4]+e[8]*t[7],e[6]*t[2]+e[7]*t[5]+e[8]*t[8]]}var r=!0;function i(e){r=e}function a(){return r}var o=new WeakMap,s=(e,t,n)=>[e,t,n].sort((e,t)=>e-t).join(`,`),c=(e,t)=>e<t?`${e},${t}`:`${t},${e}`;function l(e){let t=new Map,n=e.mesh.tetrahedra,r=[[1,2,3],[0,3,2],[0,1,3],[0,2,1]];for(let e=0;e<n.length;e+=4){let i=[n[e],n[e+1],n[e+2],n[e+3]];for(let n of r){let r=s(i[n[0]],i[n[1]],i[n[2]]);t.has(r)?t.delete(r):t.set(r,{tetrahedron:e/4,indices:i})}}return t}function u(e,t=2){let n=Math.max(1,Math.floor(t)),r=a(),i=r?o.get(e):void 0;if(i?.topologyVersion===e.topologyVersion&&i.subdivisions===n)return p(i.surface,e.positions),i.surface;let s=d(e,n);return r&&o.set(e,{topologyVersion:e.topologyVersion,subdivisions:n,surface:s}),s}function d(e,t){if(e.embeddedSurface)return f(e);let n=Math.max(1,Math.floor(t)),r=e.mesh.surfaceTriangles,i=l(e),a=new Map,o=new Uint32Array(r.length/3);for(let t=0;t<r.length;t+=3){let n=r[t],i=r[t+1],s=r[t+2],l=e.surfaceFeatureMasks[n]&e.surfaceFeatureMasks[i]&e.surfaceFeatureMasks[s];if(o[t/3]=l,l!==0)for(let e of[c(n,i),c(i,s),c(s,n)])a.set(e,(a.get(e)??0)+1)}let u=[],d=[],p=[],m=[],h=[],g=[],_=[],v=[],y=[],b=new Map,x=(t,r,i,a,o)=>{let s=b.get(a);if(s!==void 0)return s;let c=m.length/3,l=[0,0,0,0];for(let e=0;e<3;e+=1){let a=i.indices.indexOf(t[e]);if(a<0)throw Error(`Render surface face is not owned by its Tet`);l[a]=r[e]/n}u.push(...i.indices),d.push(...l);let f=0,g=0,_=0;for(let t=0;t<4;t+=1){let n=i.indices[t]*3;f+=e.positions[n]*l[t],g+=e.positions[n+1]*l[t],_+=e.positions[n+2]*l[t]}return m.push(f,g,_),h.push(o),p.push(i.tetrahedron),b.set(a,c),c};for(let e=0;e<r.length;e+=3){let t=[r[e],r[e+1],r[e+2]],l=i.get(s(...t));if(!l)throw Error(`Surface triangle has no boundary Tet owner`);let u=o[e/3],d=new Map;for(let r=0;r<=n;r+=1)for(let i=0;i<=n-r;i+=1){let o=[n-r-i,r,i],s=t.map((e,t)=>[e,o[t]]).filter(([,e])=>e>0).sort(([e],[t])=>e-t).map(([e,t])=>`${e}:${t}`).join(`|`),f=[];o[0]===0&&f.push(c(t[1],t[2])),o[1]===0&&f.push(c(t[0],t[2])),o[2]===0&&f.push(c(t[0],t[1]));let p=u!==0&&f.some(e=>a.get(e)===1),m=u===0?`outer:${s}`:`cut:${e}:${s}`;d.set(`${r},${i}`,x(t,o,l,m,+!!p))}let f=u===0?g:_,p=u===0?v:y;for(let e=0;e<n;e+=1)for(let t=0;t<n-e;t+=1){let r=d.get(`${e},${t}`),i=d.get(`${e+1},${t}`),a=d.get(`${e},${t+1}`);if(f.push(r,i,a),p.push(l.tetrahedron),e+t<n-1){let n=d.get(`${e+1},${t+1}`);f.push(i,n,a),p.push(l.tetrahedron)}}}return{positions:new Float32Array(m),physicsIndices:new Uint32Array(u),weights:new Float32Array(d),vertexTetrahedra:new Uint32Array(p),triangles:new Uint32Array([...g,..._]),triangleTetrahedra:new Uint32Array([...v,...y]),outerIndexCount:g.length,cutIndexCount:_.length,wetEdge:new Float32Array(h)}}function f(e){let n=e.embeddedSurface;if(!n)throw Error(`Embedded render surface is missing`);let r=e.mesh.tetrahedra,i=e.positions,a=n.embeddingPositions??n.positions,o=[...n.positions],s=[],c=[],l=[],u=n.embeddingTopologyVersion===e.topologyVersion&&n.embeddingTetrahedra?.length===n.positions.length/3?n.embeddingTetrahedra:null,d=(e,n,o)=>{let s=e*3,c=-1/0,l=u?.[e]??0,d=[1,0,0,0],f=u?l*4:0,p=u?f+4:r.length;for(let e=f;e<p;e+=4){if(o!==void 0&&n?.[e/4]!==o)continue;let u=r.subarray(e,e+4),f=u[0]*3,p=u[1]*3,m=u[2]*3,h=u[3]*3,g=t([i[p]-i[f],i[m]-i[f],i[h]-i[f],i[p+1]-i[f+1],i[m+1]-i[f+1],i[h+1]-i[f+1],i[p+2]-i[f+2],i[m+2]-i[f+2],i[h+2]-i[f+2]]),_=a[s]-i[f],v=a[s+1]-i[f+1],y=a[s+2]-i[f+2],b=g[0]*_+g[1]*v+g[2]*y,x=g[3]*_+g[4]*v+g[5]*y,S=g[6]*_+g[7]*v+g[8]*y,C=[1-b-x-S,b,x,S],w=Math.min(...C);if(!(w<=c)&&(c=w,l=e/4,d=C,w>=-1e-5))break}return{tetrahedron:l,weights:d,minimumWeight:c}},f=Array.from({length:n.positions.length/3},(e,t)=>d(t));if(!u){let t=r.length/4,i=Array.from({length:e.positions.length/3},()=>[]);for(let e=0;e<t;e+=1)for(let t=0;t<4;t+=1)i[r[e*4+t]].push(e);let a=new Int32Array(t);a.fill(-1);let o=0;for(let e=0;e<t;e+=1){if(a[e]>=0)continue;a[e]=o;let t=[e];for(let e=0;e<t.length;e+=1){let n=t[e];for(let e=0;e<4;e+=1){let s=r[n*4+e];for(let e of i[s])a[e]>=0||(a[e]=o,t.push(e))}}o+=1}let s=new Int32Array(n.positions.length/3);for(let e=0;e<s.length;e+=1)s[e]=e;let c=e=>{let t=e;for(;s[t]!==t;)t=s[t];for(;s[e]!==e;){let n=s[e];s[e]=t,e=n}return t},l=(e,t)=>{let n=c(e),r=c(t);n!==r&&(s[r]=n)};for(let e=0;e<n.triangles.length;e+=3)l(n.triangles[e],n.triangles[e+1]),l(n.triangles[e],n.triangles[e+2]);let u=new Map;for(let e=0;e<f.length;e+=1){let t=c(e),n=a[f[e].tetrahedron],r=u.get(t)??new Map,i=r.get(n)??{count:0,minimumWeightSum:0};i.count+=1,i.minimumWeightSum+=f[e].minimumWeight,r.set(n,i),u.set(t,r)}let p=new Map;for(let[e,t]of u){let n=-1,r={count:-1,minimumWeightSum:-1/0};for(let[e,i]of t)(i.count>r.count||i.count===r.count&&i.minimumWeightSum>r.minimumWeightSum)&&(n=e,r=i);p.set(e,n)}for(let e=0;e<f.length;e+=1){let t=p.get(c(e));t!==void 0&&a[f[e].tetrahedron]!==t&&(f[e]=d(e,a,t))}}for(let e=0;e<f.length;e+=1){let t=f[e],n=t.tetrahedron*4;l[e]=t.tetrahedron;for(let e=0;e<4;e+=1)s.push(r[n+e]),c.push(t.weights[e])}let p=[],m=[],h=[];for(let e=0;e<n.triangles.length/3;e+=1){let t=e*3,r=(n.triangleFeatureMasks?.[e]??0)===0?p:m;r.push(n.triangles[t],n.triangles[t+1],n.triangles[t+2]),r===p&&h.push(l[n.triangles[t]])}let g=[];for(let e=0;e<n.triangles.length/3;e+=1)(n.triangleFeatureMasks?.[e]??0)!==0&&g.push(l[n.triangles[e*3]]);let _=Array(n.positions.length/3).fill(0);for(let e of m)_[e]=.72;return{positions:new Float32Array(o),physicsIndices:new Uint32Array(s),weights:new Float32Array(c),vertexTetrahedra:new Uint32Array(l),triangles:new Uint32Array([...p,...m]),triangleTetrahedra:new Uint32Array([...h,...g]),outerIndexCount:p.length,cutIndexCount:m.length,wetEdge:new Float32Array(_)}}function p(e,t){for(let n=0;n<e.positions.length/3;n+=1){let r=0,i=0,a=0;for(let o=0;o<4;o+=1){let s=e.physicsIndices[n*4+o]*3,c=e.weights[n*4+o];r+=t[s]*c,i+=t[s+1]*c,a+=t[s+2]*c}e.positions[n*3]=r,e.positions[n*3+1]=i,e.positions[n*3+2]=a}}var m=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],h=[[1,2,3],[0,3,2],[0,1,3],[0,2,1]];function g(e,t){let n=t*3;return[e[n],e[n+1],e[n+2]]}function _(e,t){let n=t*9;return[[e.triangles[n],e.triangles[n+1],e.triangles[n+2]],[e.triangles[n+3],e.triangles[n+4],e.triangles[n+5]],[e.triangles[n+6],e.triangles[n+7],e.triangles[n+8]]]}function v(e,t=0){let n=[1/0,1/0,1/0],r=[-1/0,-1/0,-1/0];for(let i of e)for(let e=0;e<3;e+=1)n[e]=Math.min(n[e],i[e]-t),r[e]=Math.max(r[e],i[e]+t);return{minimum:n,maximum:r}}function y(e,t){for(let n=0;n<3;n+=1)if(e.maximum[n]<t.minimum[n]||t.maximum[n]<e.minimum[n])return!1;return!0}function b(e,t){return[e[0]-t[0],e[1]-t[1],e[2]-t[2]]}function x(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function S(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function C(e,t,n){let r=b(t,e),i=b(n[1],n[0]),a=b(n[2],n[0]),o=S(r,a),s=x(i,o);if(Math.abs(s)<1e-10)return!1;let c=1/s,l=b(e,n[0]),u=x(l,o)*c;if(u<-1e-7||u>1.0000001)return!1;let d=S(l,i),f=x(r,d)*c;if(f<-1e-7||u+f>1.0000001)return!1;let p=x(a,d)*c;return p>=-1e-7&&p<=1.0000001}function w(e,t,n,r,i){let a=S(b(n,t),b(r,t));return x(a,b(e,t))*x(a,b(i,t))>=-1e-9}function T(e,t){return w(e,t[1],t[2],t[3],t[0])&&w(e,t[0],t[3],t[2],t[1])&&w(e,t[0],t[1],t[3],t[2])&&w(e,t[0],t[2],t[1],t[3])}function E(e,t){if(e.some(e=>T(e,t)))return!0;for(let[n,r]of m)if(C(t[n],t[r],e))return!0;for(let n=0;n<3;n+=1){let r=e[n],i=e[(n+1)%3];for(let[e,n,a]of h)if(C(r,i,[t[e],t[n],t[a]]))return!0}return!1}function D(e,t,n){let r=n.triangles.length/9,i=Array.from({length:r},(e,t)=>_(n,t)),a=i.map(e=>v(e,n.width)),o=[];for(let r=0;r<e.tetrahedra.length/4;r+=1){let s=r*4,c=[g(t,e.tetrahedra[s]),g(t,e.tetrahedra[s+1]),g(t,e.tetrahedra[s+2]),g(t,e.tetrahedra[s+3])],l=v(c,n.width);i.some((e,t)=>y(l,a[t])&&E(e,c))&&o.push(r)}return new Uint32Array(o)}var O=Math.floor(Math.sqrt(2**53-1)),k=Math.floor(Math.cbrt(2**53-1));function A(e,t,n){let r=Math.min(e,t),i=Math.max(e,t);return n<=O?r*n+i:`${r},${i}`}function j(e,t,n,r){let i=e,a=t,o=n;return i>a&&([i,a]=[a,i]),a>o&&([a,o]=[o,a]),i>a&&([i,a]=[a,i]),r<=k?(i*r+a)*r+o:`${i},${a},${o}`}function M(e,t,n){let r=new Uint32Array(t);N(e,r);let i=P(r,e.length/3);return{restPositions:e,tetrahedra:r,surfaceTriangles:i.triangles,surfaceVertices:i.vertices,surfaceEdges:i.edges,surfaceVertexNeighbours:i.vertexNeighbours,particleRadius:n}}function ee(e,t,n,r,i){let a=t*3,o=n*3,s=r*3,c=i*3;return[e[o]-e[a],e[s]-e[a],e[c]-e[a],e[o+1]-e[a+1],e[s+1]-e[a+1],e[c+1]-e[a+1],e[o+2]-e[a+2],e[s+2]-e[a+2],e[c+2]-e[a+2]]}function N(t,n){for(let r=0;r<n.length;r+=4){let i=n[r],a=n[r+1],o=n[r+2],s=n[r+3];e(ee(t,i,a,o,s))<0&&(n[r+1]=o,n[r+2]=a)}}function P(e,t){let n=new Map,r=(e,r,i)=>{let a=j(e,r,i,t),o=n.get(a);o?o.count+=1:n.set(a,{count:1,oriented:[e,r,i]})};for(let t=0;t<e.length;t+=4){let n=e[t],i=e[t+1],a=e[t+2],o=e[t+3];r(i,a,o),r(n,o,a),r(n,i,o),r(n,a,i)}let i=[],a=new Set;for(let e of n.values())if(e.count===1){i.push(...e.oriented);for(let t of e.oriented)a.add(t)}let o=[],s=new Set,c=Array.from({length:t},()=>new Set),l=(e,n)=>{let r=Math.min(e,n),i=Math.max(e,n),a=A(r,i,t);s.has(a)||(s.add(a),o.push(r,i)),c[e].add(n),c[n].add(e)};for(let e=0;e<i.length;e+=3){let t=i[e],n=i[e+1],r=i[e+2];l(t,n),l(n,r),l(r,t)}return{triangles:new Uint32Array(i),vertices:new Uint32Array(a),edges:new Uint32Array(o),vertexNeighbours:c.map(e=>new Uint32Array(e))}}function F(e,t,n,r=3){let i=r+1,a=[],o=(e,t,n)=>e+i*(t+i*n),s=.42;for(let i=0;i<=r;i+=1)for(let o=0;o<=r;o+=1)for(let c=0;c<=r;c+=1){let l=c/r*2-1,u=o/r*2-1,d=i/r*2-1,f=l*Math.sqrt(Math.max(0,1-u*u/2-d*d/2+u*u*d*d/3)),p=u*Math.sqrt(Math.max(0,1-d*d/2-l*l/2+d*d*l*l/3)),m=d*Math.sqrt(Math.max(0,1-l*l/2-u*u/2+l*l*u*u/3));a.push(e*(l+(f-l)*s)/2,t*(u+(p-u)*s)/2,n*(d+(m-d)*s)/2)}let c=[],l=[[0,1,3,7],[0,1,5,7],[0,2,3,7],[0,2,6,7],[0,4,5,7],[0,4,6,7]];for(let e=0;e<r;e+=1)for(let t=0;t<r;t+=1)for(let n=0;n<r;n+=1){let r=[o(n,t,e),o(n+1,t,e),o(n,t+1,e),o(n+1,t+1,e),o(n,t,e+1),o(n+1,t,e+1),o(n,t+1,e+1),o(n+1,t+1,e+1)];for(let e of l)c.push(...e.map(e=>r[e]))}return M(new Float32Array(a),new Uint32Array(c),Math.min(e,t,n)/r*.42)}function I(e,t,n=3,r=12){let i=n+1,a=(e,t,n)=>e+i*(n+i*t),o=e/2,s=t/2-o,c=[];for(let e=0;e<=r;e+=1){let i=t*(e/r-.5),a=Math.max(0,i-s),l=Math.max(.12,Math.sqrt(Math.max(0,1-(a/o)**2)));for(let e=0;e<=n;e+=1)for(let t=0;t<=n;t+=1){let r=t/n*2-1,a=e/n*2-1,s=r*Math.sqrt(1-a*a/2),u=a*Math.sqrt(1-r*r/2);c.push(o*l*s,i,o*l*u)}}let l=[],u=[[0,1,3,7],[0,1,5,7],[0,2,3,7],[0,2,6,7],[0,4,5,7],[0,4,6,7]];for(let e=0;e<r;e+=1)for(let t=0;t<n;t+=1)for(let r=0;r<n;r+=1){let n=[a(r,e,t),a(r+1,e,t),a(r,e,t+1),a(r+1,e,t+1),a(r,e+1,t),a(r+1,e+1,t),a(r,e+1,t+1),a(r+1,e+1,t+1)];for(let e of u)l.push(...e.map(e=>n[e]))}return M(new Float32Array(c),new Uint32Array(l),e/n*.42)}function L(e,t,n=5,r=5){let i=n+1,a=(e,t,n)=>e+i*(n+i*t),o=e/2,s=[];for(let e=0;e<=r;e+=1){let i=e/r,a=.9+.1*Math.sin(Math.min(1,i/.22)*Math.PI/2),c=1-.2*i*i;for(let e=0;e<=n;e+=1)for(let r=0;r<=n;r+=1){let l=r/n*2-1,u=e/n*2-1,d=l*Math.sqrt(1-u*u/2),f=u*Math.sqrt(1-l*l/2),p=Math.min(1,Math.hypot(d,f)),m=Math.atan2(f,d),h=.3+.7*Math.sin(Math.PI*i)**.7,g=1+Math.cos(m*8)*.115*p**1.35*h,_=i**6,v=Math.exp(-(((p-.58)/.25)**2))*.045,y=(1-p)**2*.12,b=p**4*.035,x=t*_*(v-y-b);s.push(o*a*c*g*d,t*(i-.5)+x,o*a*c*g*f)}}let c=[],l=[[0,1,3,7],[0,1,5,7],[0,2,3,7],[0,2,6,7],[0,4,5,7],[0,4,6,7]];for(let e=0;e<r;e+=1)for(let t=0;t<n;t+=1)for(let r=0;r<n;r+=1){let n=[a(r,e,t),a(r+1,e,t),a(r,e,t+1),a(r+1,e,t+1),a(r,e+1,t),a(r+1,e+1,t),a(r,e+1,t+1),a(r+1,e+1,t+1)];for(let e of l)c.push(...e.map(e=>n[e]))}return M(new Float32Array(s),new Uint32Array(c),e/n*.36)}function R(e,t,n,r=7,i=9,a=6){let o=1/0,s=1/0,c=1/0,l=-1/0,u=-1/0,d=-1/0;for(let t=0;t<e.length;t+=3)o=Math.min(o,e[t]),s=Math.min(s,e[t+1]),c=Math.min(c,e[t+2]),l=Math.max(l,e[t]),u=Math.max(u,e[t+1]),d=Math.max(d,e[t+2]);let f=(l-o)/r,p=(u-s)/i,m=(d-c)/a,h=new Uint8Array(r*i*a),g=(e,t,n)=>e+r*(t+i*n),_=(n,r,i)=>{let a=0;for(let o=0;o<t.length;o+=3){let s=t[o]*3,c=t[o+1]*3,l=t[o+2]*3,u=e[s+1],d=e[s+2],f=e[c+1],p=e[c+2],m=e[l+1],h=e[l+2],g=(p-h)*(u-m)+(m-f)*(d-h);if(Math.abs(g)<1e-10)continue;let _=((p-h)*(r-m)+(m-f)*(i-h))/g,v=((h-d)*(r-m)+(u-m)*(i-h))/g,y=1-_-v;_<-1e-7||v<-1e-7||y<-1e-7||_*e[s]+v*e[c]+y*e[l]>n+1e-7&&(a+=1)}return a};for(let e=0;e<a;e+=1)for(let t=0;t<i;t+=1)for(let n=0;n<r;n+=1)_(o+(n+.5)*f,s+(t+.5)*p,c+(e+.5)*m)%2==1&&(h[g(n,t,e)]=1);for(let t=0;t<e.length;t+=3){let n=Math.min(r-1,Math.max(0,Math.floor((e[t]-o)/f))),l=Math.min(i-1,Math.max(0,Math.floor((e[t+1]-s)/p))),u=Math.min(a-1,Math.max(0,Math.floor((e[t+2]-c)/m)));h[g(n,l,u)]=1}let v=e=>{let[t,n,r,i]=e;h[t]!==0&&h[i]!==0&&h[n]===0&&h[r]===0?(h[n]=1,h[r]=1):h[n]!==0&&h[r]!==0&&h[t]===0&&h[i]===0&&(h[t]=1,h[i]=1)};for(let e=0;e<2;e+=1){for(let e=0;e<a;e+=1)for(let t=0;t<i-1;t+=1)for(let n=0;n<r-1;n+=1)v([g(n,t,e),g(n+1,t,e),g(n,t+1,e),g(n+1,t+1,e)]);for(let e=0;e<i;e+=1)for(let t=0;t<a-1;t+=1)for(let n=0;n<r-1;n+=1)v([g(n,e,t),g(n+1,e,t),g(n,e,t+1),g(n+1,e,t+1)]);for(let e=0;e<r;e+=1)for(let t=0;t<a-1;t+=1)for(let n=0;n<i-1;n+=1)v([g(e,n,t),g(e,n+1,t),g(e,n,t+1),g(e,n+1,t+1)])}let y=new Map,b=[],x=(e,t,r)=>{let i=`${e},${t},${r}`,a=y.get(i);if(a!==void 0)return a;let l=b.length/3;return y.set(i,l),b.push((o+e*f)*n,(s+t*p-.5)*n,(c+r*m)*n),l},S=[[0,1,3,7],[0,1,5,7],[0,2,3,7],[0,2,6,7],[0,4,5,7],[0,4,6,7]],C=[];for(let e=0;e<a;e+=1)for(let t=0;t<i;t+=1)for(let n=0;n<r;n+=1){if(h[g(n,t,e)]===0)continue;let r=[x(n,t,e),x(n+1,t,e),x(n,t+1,e),x(n+1,t+1,e),x(n,t,e+1),x(n+1,t,e+1),x(n,t+1,e+1),x(n+1,t+1,e+1)];for(let e of S)C.push(...e.map(e=>r[e]))}if(C.length===0)throw Error(`PLY voxelization produced an empty volume`);return M(new Float32Array(b),new Uint32Array(C),Math.min(f,p,m)*n*.36)}var z=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],B=[[1,2,3],[0,3,2],[0,1,3],[0,2,1]];function V(e,t){let n=t*3;return[e[n],e[n+1],e[n+2]]}function te(e,t){return Math.hypot(e[0]-t[0],e[1]-t[1],e[2]-t[2])}function H(e,t,n){let r=[t[0]-e[0],t[1]-e[1],t[2]-e[2]],i=[n[0]-e[0],n[1]-e[1],n[2]-e[2]];return .5*Math.hypot(r[1]*i[2]-r[2]*i[1],r[2]*i[0]-r[0]*i[2],r[0]*i[1]-r[1]*i[0])}function U(e,t,n){return e[0]*(t[1]*n[2]-t[2]*n[1])-t[0]*(e[1]*n[2]-e[2]*n[1])+n[0]*(e[1]*t[2]-e[2]*t[1])}function W(e){let t=e[0],n=e.slice(1).map(e=>[e[0]-t[0],e[1]-t[1],e[2]-t[2]]),r=U(n[0],n[1],n[2]);if(Math.abs(r)<1e-15)return 1/0;let i=n.map(e=>.5*(e[0]**2+e[1]**2+e[2]**2)),a=[n[0][0],n[0][1],n[0][2]],o=[n[1][0],n[1][1],n[1][2]],s=[n[2][0],n[2][1],n[2][2]],c=((e,t,n)=>e[0]*(t[1]*n[2]-t[2]*n[1])-e[1]*(t[0]*n[2]-t[2]*n[0])+e[2]*(t[0]*n[1]-t[1]*n[0]))(a,o,s),l=(i[0]*(o[1]*s[2]-o[2]*s[1])-a[1]*(i[1]*s[2]-o[2]*i[2])+a[2]*(i[1]*s[1]-o[1]*i[2]))/c,u=(a[0]*(i[1]*s[2]-o[2]*i[2])-i[0]*(o[0]*s[2]-o[2]*s[0])+a[2]*(o[0]*i[2]-i[1]*s[0]))/c,d=(a[0]*(o[1]*i[2]-i[1]*s[1])-a[1]*(o[0]*i[2]-i[1]*s[0])+i[0]*(o[0]*s[1]-o[1]*s[0]))/c;return Math.hypot(l,u,d)}function ne(e,t){let n=t.map(t=>V(e,t)),r=n[1].map((e,t)=>e-n[0][t]),i=n[2].map((e,t)=>e-n[0][t]),a=n[3].map((e,t)=>e-n[0][t]),o=Math.abs(U(r,i,a))/6,s=1/0;for(let[e,t]of z)s=Math.min(s,te(n[e],n[t]));let c=0;for(let[e,t,r]of B)c+=H(n[e],n[t],n[r]);let l=c>0?3*o/c:0,u=W(n),d=Number.isFinite(u)&&u>0?Math.max(0,Math.min(1,3*l/u)):0;return{restVolume:o,shortestEdge:s,radiusRatio:d}}function re(e){let t=new Int32Array(e.restPositions.length/3);t.fill(-1);let n=e=>{let n=e;for(;t[n]!==n;)n=t[n];for(;t[e]!==e;){let r=t[e];t[e]=n,e=r}return n},r=(e,r)=>{let i=n(e),a=n(r);i!==a&&(t[a]=i)};for(let n of e.tetrahedra)t[n]=n;for(let t=0;t<e.tetrahedra.length;t+=4){let n=e.tetrahedra[t];for(let i=1;i<4;i+=1)r(n,e.tetrahedra[t+i])}let i=new Set;for(let e=0;e<t.length;e+=1)t[e]>=0&&i.add(n(e));return i.size}function G(e){let t=new Map,n=e.restPositions.length/3;for(let r=0;r<e.surfaceTriangles.length;r+=3){let i=[e.surfaceTriangles[r],e.surfaceTriangles[r+1],e.surfaceTriangles[r+2]];for(let e=0;e<3;e+=1){let r=i[e],a=i[(e+1)%3],o=A(r,a,n);t.set(o,(t.get(o)??0)+1)}}let r=0;for(let e of t.values())e!==2&&(r+=1);return r}function ie(e,t=1e3){let n=0,r=1/0,i=1/0,a=1/0,o=0,s=!0,c=[0,0,0],l=new Uint8Array(e.restPositions.length/3);for(let t=0;t<e.tetrahedra.length;t+=4){let u=[e.tetrahedra[t],e.tetrahedra[t+1],e.tetrahedra[t+2],e.tetrahedra[t+3]],d=ne(e.restPositions,u);n+=d.restVolume,r=Math.min(r,d.restVolume),i=Math.min(i,d.shortestEdge),a=Math.min(a,d.radiusRatio),(d.restVolume<=1e-12||d.radiusRatio<=1e-8)&&(o+=1),s&&=Number.isFinite(d.restVolume+d.shortestEdge+d.radiusRatio);for(let t of u){l[t]=1;let n=t*3;for(let t=0;t<3;t+=1)c[t]+=e.restPositions[n+t]*d.restVolume/4}}let u=0;for(let e of l)e===0&&(u+=1);let d=n>0?c.map(e=>e/n):[0,0,0];for(let t of e.restPositions)s&&=Number.isFinite(t);return{restVolume:n,mass:n*t,centerOfMass:d,minimumRestVolume:r===1/0?0:r,minimumEdgeLength:i===1/0?0:i,minimumRadiusRatio:a===1/0?0:a,degenerateTetrahedra:o,isolatedVertices:u,connectedComponents:re(e),nonManifoldSurfaceEdges:G(e),finite:s}}function ae(e,t){return Math.abs(e-t)/Math.max(Math.abs(e),Math.abs(t),1e-12)}var oe=[[1,2,3],[0,3,2],[0,1,3],[0,2,1]],se=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];function ce(e,t,n,r,i,a){let o=Math.hypot(r[0],r[1],r[2]);if(o<1e-8)return null;let s=[r[0]/o,r[1]/o,r[2]/o],c=[n[0]+s[0]*i,n[1]+s[1]*i,n[2]+s[2]*i],l=e.restPositions.length/3,u=a?new Uint8Array(l):null;if(a&&u){for(let t=0;t<e.tetrahedra.length;t+=4)if(a[t/4]!==0)for(let n=0;n<4;n+=1)u[e.tetrahedra[t+n]]=1}let d=new Float64Array(l),f=new Int8Array(l),p=Math.max(e.particleRadius*5e-4,1e-8);for(let e=0;e<l;e+=1){if(u&&!u[e])continue;let n=e*3,r=(t[n]-c[0])*s[0]+(t[n+1]-c[1])*s[1]+(t[n+2]-c[2])*s[2];d[e]=r,r>p?f[e]=1:r<-p&&(f[e]=-1)}let m=2e-4;for(let t=0;t<e.tetrahedra.length;t+=4)if(!(a&&a[t/4]===0))for(let[n,r]of se){let i=e.tetrahedra[t+n],a=e.tetrahedra[t+r];if(f[i]*f[a]>=0)continue;let o=Math.abs(d[i])/(Math.abs(d[i])+Math.abs(d[a]));o<m?f[i]=0:1-o<m&&(f[a]=0)}let h=!1,g=!1;for(let e=0;e<l;e+=1)u&&!u[e]||(h||=f[e]>0,g||=f[e]<0);if(!h||!g)return null;let _=Array.from(e.restPositions),v=[],y=[],b=[],x=new Map,S=new Map,C=new Map,w=new Map,T=0,E=e=>{if(e<l)return new Map([[e,1]]);let t=x.get(e);if(!t)throw Error(`Missing interpolation for cut vertex ${e}`);return t},D=t=>{let n=0;for(let e of t.values())n+=e;let r=new Map;for(let[e,i]of t){let t=i/n;Math.abs(t)>1e-10&&r.set(e,t)}let i=[...r].sort(([e],[t])=>e-t),a=_.length/3,o=0,s=0,c=0;for(let[t,n]of i){let r=t*3;o+=e.restPositions[r]*n,s+=e.restPositions[r+1]*n,c+=e.restPositions[r+2]*n}return _.push(o,s,c),x.set(a,r),b.push({indices:new Uint32Array(i.map(([e])=>e)),weights:new Float32Array(i.map(([,e])=>e))}),a},O=(e,t)=>{if(f[e]!==0||t<0)return e;let n=S.get(e);if(n!==void 0)return n;let r=D(new Map([[e,1]]));return S.set(e,r),w.set(e,r),r},k=(e,t,n)=>{if(f[e]===0)return O(e,n);if(f[t]===0)return O(t,n);let r=A(Math.min(e,t),Math.max(e,t),l),i=C.get(r);if(!i){let n=d[e]-d[t],a=d[e]/n,o=new Map([[e,1-a],[t,a]]);i={negative:D(o),positive:D(o)},C.set(r,i),w.set(i.negative,i.positive)}return n<0?i.negative:i.positive},ee=e=>{let t=[];for(let n of e)t.at(-1)!==n&&t.push(n);return t.length>1&&t[0]===t.at(-1)&&t.pop(),t},N=(e,t)=>{let n=[];for(let r=0;r<e.length;r+=1){let i=e[r],a=e[(r+1)%e.length];f[i]*t>=0&&n.push(O(i,t)),f[i]*f[a]<0&&n.push(k(i,a,t))}return ee(n)},P=e=>{let n=E(e),r=0,i=0,a=0;for(let[e,o]of n){let n=e*3;r+=t[n]*o,i+=t[n+1]*o,a+=t[n+2]*o}return[r,i,a]},F=e=>{let t=[...new Set(e)];if(t.length<3)return t;let n=[0,0,0];for(let e of t){let t=P(e);n[0]+=t[0],n[1]+=t[1],n[2]+=t[2]}n[0]/=t.length,n[1]/=t.length,n[2]/=t.length;let r=Math.abs(s[0])<.8?[1,0,0]:[0,1,0],i=[s[1]*r[2]-s[2]*r[1],s[2]*r[0]-s[0]*r[2],s[0]*r[1]-s[1]*r[0]],a=Math.hypot(...i);i=i.map(e=>e/a);let o=[s[1]*i[2]-s[2]*i[1],s[2]*i[0]-s[0]*i[2],s[0]*i[1]-s[1]*i[0]];return t.sort((e,t)=>{let r=P(e),a=P(t),s=e=>{let t=(e[0]-n[0])*i[0]+(e[1]-n[1])*i[1]+(e[2]-n[2])*i[2],r=(e[0]-n[0])*o[0]+(e[1]-n[1])*o[1]+(e[2]-n[2])*o[2];return Math.atan2(r,t)};return s(r)-s(a)})},I=e=>{if(e.length<3)return[];let t=e.indexOf(Math.min(...e)),n=[...e.slice(t),...e.slice(0,t)],r=[];for(let e=1;e<n.length-1;e+=1)r.push([n[0],n[e],n[e+1]]);return r},L=(e,t,n,r)=>{let i=e*3,a=t*3,o=n*3,s=r*3,c=[_[a]-_[i],_[a+1]-_[i+1],_[a+2]-_[i+2]],l=[_[o]-_[i],_[o+1]-_[i+1],_[o+2]-_[i+2]],u=[_[s]-_[i],_[s+1]-_[i+1],_[s+2]-_[i+2]];return c[0]*(l[1]*u[2]-l[2]*u[1])-c[1]*(l[0]*u[2]-l[2]*u[0])+c[2]*(l[0]*u[1]-l[1]*u[0])},R=(e,t)=>{v.push(t[0],t[1],t[2],t[3]),y.push(e)},z=(e,t,n)=>{let r=[];for(let n of oe){let i=n.map(t=>e[t]),a=N(i,t);a.length>=3&&r.push(a)}let i=[];for(let n of e)f[n]===0&&i.push(O(n,t));for(let[n,r]of se){let a=e[n],o=e[r];f[a]*f[o]<0&&i.push(k(a,o,t))}let a=F(i);a.length>=3&&r.push(a);let o=[...new Set(r.flat())],s=Math.min(...o);for(let e of r)if(!e.includes(s))for(let t of I(e))Math.abs(L(s,...t))>1e-12&&R(n,[s,...t])};for(let t=0;t<e.tetrahedra.length;t+=4){let n=t/4,r=[e.tetrahedra[t],e.tetrahedra[t+1],e.tetrahedra[t+2],e.tetrahedra[t+3]];if(a&&a[n]===0){R(n,r);continue}let i=r.some(e=>f[e]>0),o=r.some(e=>f[e]<0);if(i&&o){T+=1,z(r,-1,n),z(r,1,n);continue}let s=i?1:-1;R(n,r.map(e=>O(e,s)))}if(T===0&&S.size===0)return null;let B=M(new Float32Array(_),new Uint32Array(v),e.particleRadius),V=B.restPositions.length/3,te=new Map;for(let e=0;e<B.surfaceTriangles.length;e+=3){let t=[B.surfaceTriangles[e],B.surfaceTriangles[e+1],B.surfaceTriangles[e+2]];te.set(j(...t,V),t)}let H=[];for(let e of te.values()){let t=e.map(e=>w.get(e));if(t.some(e=>e===void 0))continue;let n=te.get(j(t[0],t[1],t[2],V));n&&H.push(...e,...n)}let U=[...w].flatMap(([e,t])=>[e,t]);return{mesh:B,tetrahedronParents:new Uint32Array(y),vertexInterpolations:b,cutSurface:{point:c,normal:s,vertexPairs:new Uint32Array(U),trianglePairs:new Uint32Array(H)},diagnostics:ie(B),planeOffset:i}}function le(e,t,n,r,i){let a=ie(e),o=Math.max(e.particleRadius*.002,2e-6),s=[0,o,-o,o*2,-o*2],c=ce(e,t,n,r,0,i);if(!c||c.diagnostics.connectedComponents<=a.connectedComponents)return null;let l=null,u=-1/0;for(let d of s){let s=d===0?c:ce(e,t,n,r,d,i);if(!s)continue;let f=s.diagnostics,p=ae(a.restVolume,f.restVolume),m=ae(a.mass,f.mass),h=Math.hypot(a.centerOfMass[0]-f.centerOfMass[0],a.centerOfMass[1]-f.centerOfMass[1],a.centerOfMass[2]-f.centerOfMass[2])/Math.max(e.particleRadius,1e-8),g=Math.max(a.restVolume*1e-10,2e-11);if(!(f.finite&&f.degenerateTetrahedra===0&&f.minimumRestVolume>=g&&f.minimumRadiusRatio>=2e-4&&f.nonManifoldSurfaceEdges===0&&f.isolatedVertices===0&&p<=1e-5&&m<=1e-5&&h<=1e-5&&s.cutSurface.trianglePairs.length>0))continue;if(d===0&&f.minimumRadiusRatio>=.01)return s;let _=f.minimumRadiusRatio-Math.abs(d)/o*1e-6;_>u&&(l=s,u=_)}return l}function K(e,t,n,r,i){let a=r=>{let i=r*3,a=[e.positions[i],e.positions[i+1],e.positions[i+2]];return{key:`v${r}`,position:a,embeddingPosition:e.embeddingPositions?[e.embeddingPositions[i],e.embeddingPositions[i+1],e.embeddingPositions[i+2]]:a,distance:(a[0]-t[0])*n[0]+(a[1]-t[1])*n[1]+(a[2]-t[2])*n[2]}},o=(e,t)=>{let n=e.distance-t.distance,r=Math.abs(n)>1e-9?e.distance/n:.5,i=[e.key,t.key].sort();return{key:`e${i[0]}|${i[1]}`,position:[e.position[0]+(t.position[0]-e.position[0])*r,e.position[1]+(t.position[1]-e.position[1])*r,e.position[2]+(t.position[2]-e.position[2])*r],embeddingPosition:[e.embeddingPosition[0]+(t.embeddingPosition[0]-e.embeddingPosition[0])*r,e.embeddingPosition[1]+(t.embeddingPosition[1]-e.embeddingPosition[1])*r,e.embeddingPosition[2]+(t.embeddingPosition[2]-e.embeddingPosition[2])*r],distance:0}},s=(e,t)=>{let n=[];for(let r=0;r<e.length;r+=1){let i=e[r],a=e[(r+1)%e.length],s=i.distance*t>=-1e-6,c=a.distance*t>=-1e-6;s&&c?n.push(a):s?n.push(o(i,a)):c&&n.push(o(i,a),a)}return n.filter((e,t)=>e.key!==n[t-1]?.key)},c=[],l=[],u=[],d=[],f=[],p=new Map,m=(e,t)=>{let i=`${t}:${e.key}`,a=p.get(i);if(a!==void 0)return a;let o=c.length/3;p.set(i,o),c.push(...e.position);let s=Math.abs(e.distance)<=1e-6?r*.04:0;return l.push(e.embeddingPosition[0]+n[0]*t*s,e.embeddingPosition[1]+n[1]*t*s,e.embeddingPosition[2]+n[2]*t*s),f.push(t),o},h=(e,t,n,r)=>{e===t||t===n||n===e||(u.push(e,t,n),d.push(r))},g=(e,t,n)=>{if(e.length<3)return;let r=e.map(e=>m(e,t));for(let e=1;e<r.length-1;e+=1)h(r[0],r[e],r[e+1],n)};for(let t=0;t<e.triangles.length;t+=3){let n=[a(e.triangles[t]),a(e.triangles[t+1]),a(e.triangles[t+2])],r=e.triangleFeatureMasks?.[t/3]??0;g(s(n,-1),-1,r),g(s(n,1),1,r)}let _=(e,t)=>e<t?`${e},${t}`:`${t},${e}`,v=new Map;for(let e=0;e<u.length;e+=3){let t=[u[e],u[e+1],u[e+2]];for(let e=0;e<3;e+=1){let n=t[e],r=t[(e+1)%3],i=_(n,r),a=v.get(i);a?a.count+=1:v.set(i,{count:1,first:n,second:r})}}let y=[...v.values()].filter(e=>e.count===1),b=new Map;for(let e of y){let t=b.get(e.first)??[];t.push(e.second),b.set(e.first,t);let n=b.get(e.second)??[];n.push(e.first),b.set(e.second,n)}let x=new Set,S=[];for(let e of y){let t=e.first,n=e.second;if(x.has(_(t,n)))continue;let r=[t],i=t,a=n;x.add(_(t,n));for(let e=0;e<=y.length&&a!==t;e+=1){r.push(a);let e=(b.get(a)??[]).find(e=>e!==i&&!x.has(_(a,e)));if(e===void 0)break;x.add(_(a,e)),i=a,a=e}a===t&&r.length>=3&&S.push(r)}let C=e=>{let[t,r,i]=e.position,a=n.map(Math.abs);return a[0]>=a[1]&&a[0]>=a[2]?[r,i]:a[1]>=a[2]?[t,i]:[t,r]},w=e=>{let t=0;for(let n=0;n<e.length;n+=1){let r=C(e[n]),i=C(e[(n+1)%e.length]);t+=r[0]*i[1]-i[0]*r[1]}return t*.5},T=(e,t,n,r)=>{let i=(e,t,n)=>(t[0]-e[0])*(n[1]-e[1])-(t[1]-e[1])*(n[0]-e[0]),a=i(t,n,e),o=i(n,r,e),s=i(r,t,e);return a>=-1e-10&&o>=-1e-10&&s>=-1e-10},E=e=>{let t=e.map(C),n=Array.from({length:e.length},(e,t)=>t);w(e)<0&&n.reverse();let r=[];for(;n.length>3;){let e=!1;for(let i=0;i<n.length;i+=1){let a=n[(i+n.length-1)%n.length],o=n[i],s=n[(i+1)%n.length],c=t[a],l=t[o],u=t[s];if((l[0]-c[0])*(u[1]-l[1])-(l[1]-c[1])*(u[0]-l[0])>1e-10&&!n.some(e=>e!==a&&e!==o&&e!==s&&T(t[e],c,l,u))){r.push(a,o,s),n.splice(i,1),e=!0;break}}if(!e)break}return n.length===3&&r.push(...n),r},D=(e,t,r)=>{let i=[t.position[0]-e.position[0],t.position[1]-e.position[1],t.position[2]-e.position[2]],a=[r.position[0]-e.position[0],r.position[1]-e.position[1],r.position[2]-e.position[2]];return(i[1]*a[2]-i[2]*a[1])*n[0]+(i[2]*a[0]-i[0]*a[2])*n[1]+(i[0]*a[1]-i[1]*a[0])*n[2]},O=1<<Math.min(i,30);for(let e of S){let t=e.map(e=>({key:`cap${e}`,position:[c[e*3],c[e*3+1],c[e*3+2]],embeddingPosition:[l[e*3],l[e*3+1],l[e*3+2]],distance:0})),n=E(t),r=f[e[0]];for(let i=0;i<n.length;i+=3){let a=n[i],o=n[i+1],s=n[i+2],c=r===-1?1:-1;D(t[a],t[o],t[s])*c<0&&([o,s]=[s,o]),h(e[a],e[o],e[s],O)}}return{positions:new Float32Array(c),triangles:new Uint32Array(u),embeddingPositions:new Float32Array(l),triangleFeatureMasks:new Uint32Array(d)}}var ue=[1,0,0,0,1,0,0,0,1];function de(e,t){let n=Math.min(1,Math.max(0,e)),r=Math.min(1,Math.max(0,t)),i=.84-n*.46;return{equilibriumWeight:i,branches:[{weight:1-i,relaxationTime:1.8*.1**r*Math.exp(.46*Math.log(.22)+.34*Math.log(.9)+.2*Math.log(3.4))}]}}function fe(e,t){return t.map(t=>{let n=new Float32Array(e*9);for(let t=0;t<e;t+=1)n.set(ue,t*9);return{...t,viscousDeformations:n}})}function pe(e,t){return e.map(e=>{let n=new Float32Array(t.length*9);for(let r=0;r<t.length;r+=1){let i=t[r]*9;n.set(e.viscousDeformations.subarray(i,i+9),r*9)}return{weight:e.weight,relaxationTime:e.relaxationTime,viscousDeformations:n}})}var me=[1,0,0,0,1,0,0,0,1];function he(e){let t=new Float32Array(e*9);for(let n=0;n<e;n+=1)t.set(me,n*9);return t}function ge(e,t){let n=new Float32Array(t.length*9);for(let r=0;r<t.length;r+=1){let i=t[r]*9;n.set(e.subarray(i,i+9),r*9)}return n}function _e(e,t){let n=t*9;return[...e.subarray(n,n+9)]}function ve(e,t){let n=new Float32Array(t.length);for(let r=0;r<t.length;r+=1)n[r]=e[t[r]];return n}function ye(e,r,i){let a=n(e,t(r)),o=[a[0]-1,(a[1]+a[3])*.5,(a[2]+a[6])*.5,(a[3]+a[1])*.5,a[4]-1,(a[5]+a[7])*.5,(a[6]+a[2])*.5,(a[7]+a[5])*.5,a[8]-1],s=0;for(let e of o)s+=e*e;let c=Math.sqrt(s),l=[1,.37,.19];for(let e=0;e<8;e+=1){let e=[(o[0]+c)*l[0]+o[1]*l[1]+o[2]*l[2],o[3]*l[0]+(o[4]+c)*l[1]+o[5]*l[2],o[6]*l[0]+o[7]*l[1]+(o[8]+c)*l[2]],t=Math.hypot(...e);if(t<1e-9)break;l=e.map(e=>e/t)}let u=[o[0]*l[0]+o[1]*l[1]+o[2]*l[2],o[3]*l[0]+o[4]*l[1]+o[5]*l[2],o[6]*l[0]+o[7]*l[1]+o[8]*l[2]],d=l[0]*u[0]+l[1]*u[1]+l[2]*u[2];return{maximumPrincipalStress:Math.max(0,2*i*d),direction:l}}function be(e,t,n,r,i,a){if(t<=n)return e;let o=t/Math.max(n,1)-1,s=Math.max(.08,r/Math.max(n*i,1e-6));return Math.min(1,e+a*o**1.35/s)}var xe=3.56,q=2400,Se=5,Ce=1.65,we=class{shape;mesh;positions;previousPositions;velocities;inverseMasses;constraints;material;maxwellBranches;plasticDeformations;cohesiveDamage;selfFractureEnabled;topologyVersion=0;cutCount=0;selfCollisionEnabled=!1;activeCutSurfaceContacts=[];topologyCollisionVertexMask;topologyCollisionTriangleMask;surfaceFeatureMasks;embeddedSurface;bladeDamage=0;bladeDamagePoint=null;bladeDamageNormal=null;bladeDamageTetrahedron=-1;selfFractureCount=0;constructor(e){this.shape=e.shape??`jelly`;let t=e.size*(.78+e.stiffness*.2),n=e.size*1.5;this.mesh=e.shape===`tube`?I(e.size,e.size*4.25):e.shape===`procedural`?L(e.size*1.55,e.size):e.shape===`bunny`&&e.renderSource?R(e.renderSource.positions,e.renderSource.triangles,n):F(e.size,t,e.size,3),this.positions=new Float32Array(this.mesh.restPositions.length),this.previousPositions=new Float32Array(this.mesh.restPositions.length),this.velocities=new Float32Array(this.mesh.restPositions.length),this.inverseMasses=new Float32Array(this.mesh.restPositions.length/3),this.topologyCollisionVertexMask=new Uint8Array(this.mesh.restPositions.length/3),this.topologyCollisionTriangleMask=new Uint8Array(this.mesh.surfaceTriangles.length/3),this.surfaceFeatureMasks=new Uint32Array(this.mesh.restPositions.length/3);let r=e.rotationY??0,i=e.rotationZ??0,a=Math.cos(r),o=Math.sin(r),s=Math.cos(i),c=Math.sin(i),l=(t,n,r)=>{let i=t*s-n*c,l=t*c+n*s;return[e.x+i*a+r*o,e.y+l,e.z-i*o+r*a]};for(let e=0;e<this.mesh.restPositions.length;e+=3){let t=this.mesh.restPositions[e],n=this.mesh.restPositions[e+1],r=this.mesh.restPositions[e+2],i=l(t,n,r);this.positions.set(i,e)}if(this.mesh.restPositions.set(this.positions),this.previousPositions.set(this.positions),e.shape===`bunny`&&e.renderSource){let t=new Float32Array(e.renderSource.positions.length);for(let r=0;r<t.length;r+=3){let i=l(e.renderSource.positions[r]*n,(e.renderSource.positions[r+1]-.5)*n,e.renderSource.positions[r+2]*n);t.set(i,r)}this.embeddedSurface={positions:t,triangles:e.renderSource.triangles}}else this.embeddedSurface=null;let u=e.jiggle??.58,d=e.recoverySpeed??.5,f=Math.min(e.sag??.15,.7),p=de(u,d);this.material=Te(e.stiffness,u,d,f,p.equilibriumWeight),this.constraints=this.createConstraints(),this.maxwellBranches=fe(this.constraints.length,p.branches),this.plasticDeformations=he(this.constraints.length),this.cohesiveDamage=new Float32Array(this.constraints.length),this.selfFractureEnabled=e.selfFracture??!1,this.assignMasses()}createConstraints(){let n=[];for(let r=0;r<this.mesh.tetrahedra.length;r+=4){let i=[this.mesh.tetrahedra[r],this.mesh.tetrahedra[r+1],this.mesh.tetrahedra[r+2],this.mesh.tetrahedra[r+3]],a=Ee(this.mesh.restPositions,i),o=e(a);n.push({indices:i,restInverse:t(a),restVolume:Math.abs(o)/6})}return n}assignMasses(){let e=new Float32Array(this.inverseMasses.length);for(let t of this.constraints){let n=1e3*t.restVolume/4;for(let r of t.indices)e[r]+=n}for(let t=0;t<e.length;t+=1)this.inverseMasses[t]=e[t]>0?1/e[t]:0}enableTopologyCollisions(e){this.selfCollisionEnabled=!0,this.activeCutSurfaceContacts.push(e),this.rebuildTopologyCollisionPatch()}get cutSurfaceContact(){return this.activeCutSurfaceContacts.at(-1)??null}advanceCutSurfaceContacts(e){for(let t=this.activeCutSurfaceContacts.length-1;t>=0;--t){let n=this.activeCutSurfaceContacts[t];n.projectionPassesRemaining=Math.max(0,n.projectionPassesRemaining-e),n.projectionPassesRemaining===0&&this.activeCutSurfaceContacts.splice(t,1)}}rebuildTopologyCollisionPatch(){let e=this.positions.length/3,t=new Uint8Array(e);for(let n=0;n<e;n+=1)this.surfaceFeatureMasks[n]!==0&&(t[n]=1);this.topologyCollisionVertexMask=new Uint8Array(e),this.topologyCollisionVertexMask.set(t);for(let n=0;n<e;n+=1)if(t[n]!==0)for(let e of this.mesh.surfaceVertexNeighbours[n])this.topologyCollisionVertexMask[e]=1;let n=this.mesh.surfaceTriangles;this.topologyCollisionTriangleMask=new Uint8Array(n.length/3);for(let e=0;e<n.length;e+=3){let r=n[e],i=n[e+1],a=n[e+2];t[r]===0&&t[i]===0&&t[a]===0||(this.topologyCollisionTriangleMask[e/3]=1,this.topologyCollisionVertexMask[r]=1,this.topologyCollisionVertexMask[i]=1,this.topologyCollisionVertexMask[a]=1)}}cut(e,t){if(this.cutCount>=Se)return!1;let n=le(this.mesh,this.positions,e,t);return!n||n.mesh.tetrahedra.length/4>q?!1:(this.applyCutTopology(n),this.enableTopologyCollisions({normal:n.cutSurface.normal,vertexPairs:n.cutSurface.vertexPairs,trianglePairs:n.cutSurface.trianglePairs,targetSeparation:this.mesh.particleRadius*.035,projectionPassesRemaining:240}),!0)}tetrahedronComponent(e){let t=this.mesh.tetrahedra.length/4,n=new Uint8Array(t);if(e<0||e>=t)return n;let r=Array.from({length:this.positions.length/3},()=>[]);for(let e=0;e<t;e+=1)for(let t=0;t<4;t+=1)r[this.mesh.tetrahedra[e*4+t]].push(e);let i=[e];n[e]=1;for(let e=0;e<i.length;e+=1){let t=i[e];for(let e=0;e<4;e+=1){let a=this.mesh.tetrahedra[t*4+e];for(let e of r[a])n[e]===0&&(n[e]=1,i.push(e))}}return n}componentVertices(e){let t=new Uint8Array(this.positions.length/3);for(let n=0;n<e.length;n+=1)if(e[n]!==0)for(let e=0;e<4;e+=1)t[this.mesh.tetrahedra[n*4+e]]=1;let n=[];for(let e=0;e<t.length;e+=1)t[e]!==0&&n.push(e);return new Uint32Array(n)}cutWithBlade(e,t=q,n){let r={intersectionMilliseconds:0,remeshingMilliseconds:0},i=Math.min(t,q);if(this.cutCount>=Se||this.constraints.length>=i)return{cut:!1,intersectedTetrahedra:0,reactionForce:0,estimatedWork:0,timings:r};let a=n===void 0?void 0:this.tetrahedronComponent(n),o=performance.now(),s=new Uint32Array([...D(this.mesh,this.positions,e)].filter(e=>!a||a[e]!==0));r.intersectionMilliseconds=performance.now()-o;let c=1+.06*Math.log1p(e.speed),l=Math.sqrt(this.material.fractureEnergy/70),u=Math.sqrt(this.material.cohesiveStrength/12e3),d=this.mesh.particleRadius*(.16+this.material.stiffness*.34)*c*l*u,f=this.material.cohesiveStrength*e.width*this.mesh.particleRadius,p=f*e.pathLength;if(s.length===0)return{cut:!1,intersectedTetrahedra:s.length,reactionForce:f,estimatedWork:p,timings:r};let m=f*d;if(a&&this.bladeDamageTetrahedron>=0&&a[this.bladeDamageTetrahedron]===0&&(this.bladeDamage=0),this.bladeDamagePoint&&this.bladeDamageNormal){let t=Math.hypot(e.point[0]-this.bladeDamagePoint[0],e.point[1]-this.bladeDamagePoint[1],e.point[2]-this.bladeDamagePoint[2]),n=Math.abs(e.normal[0]*this.bladeDamageNormal[0]+e.normal[1]*this.bladeDamageNormal[1]+e.normal[2]*this.bladeDamageNormal[2]);(t>this.mesh.particleRadius*1.5||n<.82)&&(this.bladeDamage=0)}this.bladeDamagePoint=e.point,this.bladeDamageNormal=e.normal,this.bladeDamageTetrahedron=n??-1;let h=Math.min(e.pathLength/Math.max(d,1e-6),p/Math.max(m,1e-6));if(this.bladeDamage=Math.min(1,this.bladeDamage+h),this.bladeDamage<1)return{cut:!1,intersectedTetrahedra:s.length,reactionForce:f,estimatedWork:p,timings:r};let g=performance.now(),_=le(this.mesh,this.positions,e.point,e.normal,a);return r.remeshingMilliseconds=performance.now()-g,!_||_.mesh.tetrahedra.length/4>i?{cut:!1,intersectedTetrahedra:s.length,reactionForce:f,estimatedWork:p,timings:r}:(this.applyCutTopology(_),this.enableTopologyCollisions({normal:_.cutSurface.normal,vertexPairs:_.cutSurface.vertexPairs,trianglePairs:_.cutSurface.trianglePairs,targetSeparation:Math.min(e.width*.15,this.mesh.particleRadius*.018),projectionPassesRemaining:240}),this.bladeDamage=0,this.bladeDamagePoint=null,this.bladeDamageNormal=null,this.bladeDamageTetrahedron=-1,{cut:!0,intersectedTetrahedra:s.length,reactionForce:f,estimatedWork:p,timings:r})}trySelfFracture(e){if(!this.selfFractureEnabled||this.selfFractureCount>=2)return!1;let t=this.material.youngModulus/(2*(1+this.material.poissonRatio)),r=-1,i=[1,0,0];for(let a=0;a<this.constraints.length;a+=1){let o=this.constraints[a],s=ye(n(Ee(this.positions,o.indices),o.restInverse),_e(this.plasticDeformations,a),t);if(this.cohesiveDamage[a]=be(this.cohesiveDamage[a],s.maximumPrincipalStress,this.material.cohesiveStrength,this.material.fractureEnergy,Math.cbrt(o.restVolume),e),this.cohesiveDamage[a]>=1){r=a,i=s.direction;break}}if(r<0)return!1;let a=this.constraints[r].indices,o=[0,0,0];for(let e of a)for(let t=0;t<3;t+=1)o[t]+=this.positions[e*3+t]/4;let s=this.cut(o,i);return s&&(this.selfFractureCount+=1,this.cohesiveDamage.fill(0)),s}applyCutTopology(e){let t=this.maxwellBranches,n=this.plasticDeformations,r=this.cohesiveDamage,i=this.positions.length/3,a=this.surfaceFeatureMasks;this.embeddedSurface&&=K(this.embeddedSurface,e.cutSurface.point,e.cutSurface.normal,this.mesh.particleRadius,this.cutCount);let o=t=>{let n=new Float32Array(e.mesh.restPositions.length);n.set(t);let r=t.length/3;for(let i=0;i<e.vertexInterpolations.length;i+=1){let a=e.vertexInterpolations[i],o=r+i;for(let e=0;e<3;e+=1){let r=0;for(let n=0;n<a.indices.length;n+=1)r+=t[a.indices[n]*3+e]*a.weights[n];n[o*3+e]=r}}return n};this.positions=o(this.positions),this.previousPositions=o(this.previousPositions),this.velocities=o(this.velocities),this.mesh=e.mesh,this.constraints=this.createConstraints(),this.maxwellBranches=pe(t,e.tetrahedronParents),this.plasticDeformations=ge(n,e.tetrahedronParents),this.cohesiveDamage=ve(r,e.tetrahedronParents),this.inverseMasses=new Float32Array(this.positions.length/3),this.topologyCollisionVertexMask=new Uint8Array(this.positions.length/3),this.topologyCollisionTriangleMask=new Uint8Array(this.mesh.surfaceTriangles.length/3),this.surfaceFeatureMasks=new Uint32Array(this.positions.length/3),this.surfaceFeatureMasks.set(a);for(let t=0;t<e.vertexInterpolations.length;t+=1){let n=e.vertexInterpolations[t],r=4294967295;for(let e of n.indices)r&=a[e];this.surfaceFeatureMasks[i+t]=r>>>0}let s=1<<Math.min(this.cutCount,30);for(let t of e.cutSurface.trianglePairs)this.surfaceFeatureMasks[t]|=s;this.assignMasses(),this.topologyVersion+=1,this.cutCount+=1}};function Te(e,t,n,r,i){return{stiffness:e,youngModulus:6e3*30**e,poissonRatio:.46+e*.025,velocityDamping:.32+(1-t)*1.5+(1-e)*.22,jiggle:t,recoverySpeed:n,equilibriumShearWeight:i,sag:r,yieldStress:2e3+18e4*(1-r)**3,plasticViscosity:1e4+14e4*(1-r)**2,cohesiveStrength:3e3+18e3*e,fractureEnergy:18+92*e}}function Ee(e,t){let n=t[0]*3,r=t[1]*3,i=t[2]*3,a=t[3]*3;return[e[r]-e[n],e[i]-e[n],e[a]-e[n],e[r+1]-e[n+1],e[i+1]-e[n+1],e[a+1]-e[n+1],e[r+2]-e[n+2],e[i+2]-e[n+2],e[a+2]-e[n+2]]}function De(e,t){let n=e.length/4,r=Array.from({length:t},()=>new Set),i=new Uint16Array(n),a=0;for(let t=0;t<n;t+=1){let n=new Set,o=t*4;for(let t=0;t<4;t+=1)for(let i of r[e[o+t]])n.add(i);let s=0;for(;n.has(s);)s+=1;if(s>65535)throw Error(`Tetrahedron coloring exceeded Uint16 range`);i[t]=s,a=Math.max(a,s+1);for(let t=0;t<4;t+=1)r[e[o+t]].add(s)}let o=new Uint32Array(a);for(let e of i)o[e]+=1;let s=new Uint32Array(a+1);for(let e=0;e<a;e+=1)s[e+1]=s[e]+o[e];let c=new Uint32Array(s),l=new Uint32Array(n);for(let e=0;e<n;e+=1){let t=i[e];l[c[t]]=e,c[t]+=1}return{orderedTetrahedra:l,colorOffsets:s,tetrahedronColors:i}}var Oe=new WeakMap;function ke(e,t){let n=t[0]*3,r=t[1]*3,i=t[2]*3,a=t[3]*3;return[e[r]-e[n],e[i]-e[n],e[a]-e[n],e[r+1]-e[n+1],e[i+1]-e[n+1],e[a+1]-e[n+1],e[r+2]-e[n+2],e[i+2]-e[n+2],e[a+2]-e[n+2]]}function Ae(e){let t=e.positions.length/3,n=new Uint32Array(t);for(let e=0;e<t;e+=1)n[e]=e;let r=e=>{let t=e;for(;n[t]!==t;)t=n[t];for(;n[e]!==e;){let r=n[e];n[e]=t,e=r}return t},i=(e,t)=>{let i=r(e),a=r(t);i!==a&&(n[a]=i)};for(let t=0;t<e.mesh.tetrahedra.length;t+=4){let n=e.mesh.tetrahedra[t];i(n,e.mesh.tetrahedra[t+1]),i(n,e.mesh.tetrahedra[t+2]),i(n,e.mesh.tetrahedra[t+3])}let a=new Map,o=new Uint32Array(t);for(let e=0;e<t;e+=1){let t=r(e),n=a.get(t);n===void 0&&(n=a.size,a.set(t,n)),o[e]=n}return{indices:o,count:a.size}}function je(n,r){let i=a(),o=i?Oe.get(n):void 0;if(o?.topologyVersion===n.topologyVersion)return p(o.renderSurface,n.positions),o;let s=performance.now(),c=u(n);r&&(r.renderSurfaceMilliseconds+=performance.now()-s);let l=n.mesh.tetrahedra.length/4,d=Array(l),f=new Float32Array(l);for(let r=0;r<l;r+=1){let i=r*4,a=n.mesh.tetrahedra.subarray(i,i+4),o=ke(n.mesh.restPositions,a);d[r]=t(o),f[r]=Math.abs(e(o))/6}let m=Array.from({length:n.positions.length/3},(e,t)=>{let r=new Set([t]);for(let e of n.mesh.surfaceVertexNeighbours[t]){r.add(e);for(let t of n.mesh.surfaceVertexNeighbours[e])r.add(t)}return new Uint32Array([...r].sort((e,t)=>e-t))}),h={topologyVersion:n.topologyVersion,components:Ae(n),renderSurface:c,restInverses:d,restVolumes:f,surfaceTwoRingExclusions:m,coloring:De(n.mesh.tetrahedra,n.positions.length/3)};return i&&Oe.set(n,h),h}function Me(e,t){let n=0,r=0,i=0,a=0,o=0,s=1/0;for(let t of e)n+=t.positions.length/3,r+=t.mesh.tetrahedra.length/4,i+=t.mesh.surfaceVertices.length,a+=t.mesh.surfaceTriangles.length/3,o+=t.mesh.surfaceEdges.length/2,s=Math.min(s,t.mesh.particleRadius);let c=new Float32Array(n*4),l=new Float32Array(n*4),u=new Uint32Array(n),d=new Uint32Array(n),f=new Uint32Array(n),p=new Uint32Array(n),m=Array.from({length:n},()=>[]),h=new Uint32Array(i*2),g=new Uint32Array(a*4),_=new Uint32Array(o*4),v=[],y=new Uint32Array(r*4),b=[],x=new Float32Array(r),S=new Float32Array(r*16),C=new Float32Array(r*36),w=new Float32Array(r*12),T=new Uint32Array(r),E=new Uint32Array(e.length+1),D=new Uint32Array(e.length+1),O=0,k=0,A=0,j=0,M=0,ee=0,N=e.map(e=>je(e,t));for(let t=0;t<e.length;t+=1){let n=e[t],r=N[t],i=r.components;E[t]=O,D[t]=k;let a=n.positions.length/3;for(let e=0;e<a;e+=1){let a=e*3,o=(O+e)*4;c[o]=n.positions[a],c[o+1]=n.positions[a+1],c[o+2]=n.positions[a+2],c[o+3]=n.inverseMasses[e],l[o]=n.velocities[a],l[o+1]=n.velocities[a+1],l[o+2]=n.velocities[a+2],l[o+3]=n.material.velocityDamping;let s=O+e;u[s]=t,d[s]=ee+i.indices[e],p[s]=n.selfCollisionEnabled?n.topologyCollisionVertexMask[e]:0,p[s]!==0&&(m[s]=Array.from(r.surfaceTwoRingExclusions[e],e=>O+e))}for(let e of n.mesh.surfaceVertices){let n=O+e;f[n]=t+1,h[A*2]=n,h[A*2+1]=t,A+=1}for(let e of n.activeCutSurfaceContacts)for(let t=0;t<e.vertexPairs.length;t+=2)v.push({negative:O+e.vertexPairs[t],positive:O+e.vertexPairs[t+1],normal:e.normal,targetSeparation:e.targetSeparation,maximumProjectionPasses:e.projectionPassesRemaining});for(let e=0;e<n.mesh.surfaceTriangles.length;e+=3){let t=j*4;g[t]=O+n.mesh.surfaceTriangles[e],g[t+1]=O+n.mesh.surfaceTriangles[e+1],g[t+2]=O+n.mesh.surfaceTriangles[e+2];let r=n.selfCollisionEnabled&&n.topologyCollisionTriangleMask[e/3]!==0?2147483648:0;g[t+3]=(d[g[t]]|r)>>>0,j+=1}for(let e=0;e<n.mesh.surfaceEdges.length;e+=2){let r=M*4;_[r]=O+n.mesh.surfaceEdges[e],_[r+1]=O+n.mesh.surfaceEdges[e+1],_[r+2]=t,_[r+3]=d[_[r]],M+=1}for(let e=0;e<n.mesh.tetrahedra.length;e+=4){let i=[n.mesh.tetrahedra[e],n.mesh.tetrahedra[e+1],n.mesh.tetrahedra[e+2],n.mesh.tetrahedra[e+3]],a=k+e/4;T[a]=t;for(let e=0;e<4;e+=1)y[a*4+e]=O+i[e];b[a]=r.restInverses[e/4],x[a]=r.restVolumes[e/4];let o=a*16;S[o]=n.material.youngModulus,S[o+1]=n.material.poissonRatio,S[o+2]=n.material.equilibriumShearWeight,S[o+3]=Math.min(n.maxwellBranches.length,3),S[o+12]=n.material.yieldStress,S[o+13]=n.material.plasticViscosity,S[o+14]=Math.max(.08,1-n.cohesiveDamage[e/4]);for(let t=0;t<3;t+=1){let r=n.maxwellBranches[t];if(!r)continue;S[o+4+t]=r.weight,S[o+8+t]=r.relaxationTime;let i=e/4*9,s=a*36+t*12;C.set(r.viscousDeformations.subarray(i,i+3),s),C.set(r.viscousDeformations.subarray(i+3,i+6),s+4),C.set(r.viscousDeformations.subarray(i+6,i+9),s+8)}let s=e/4*9,c=a*12;w.set(n.plasticDeformations.subarray(s,s+3),c),w.set(n.plasticDeformations.subarray(s+3,s+6),c+4),w.set(n.plasticDeformations.subarray(s+6,s+9),c+8)}O+=a,k+=n.mesh.tetrahedra.length/4,ee+=i.count}E[e.length]=O,D[e.length]=k;let P=N.map(e=>e.renderSurface),F=P.reduce((e,t)=>e+t.positions.length/3,0),I=P.reduce((e,t)=>e+t.triangles.length/3,0),L=new Float32Array(F*4),R=new Uint32Array(F*4),z=new Float32Array(F*4),B=new Uint32Array(I*4),V=new Uint32Array(e.length+1),te=new Uint32Array(e.length+1),H=0,U=0;for(let t=0;t<e.length;t+=1){let e=P[t],n=E[t];V[t]=H,te[t]=U;for(let t=0;t<e.positions.length/3;t+=1){let r=(H+t)*4,i=t*3;L[r]=e.positions[i],L[r+1]=e.positions[i+1],L[r+2]=e.positions[i+2],L[r+3]=1;for(let i=0;i<4;i+=1)R[r+i]=n+e.physicsIndices[t*4+i],z[r+i]=e.weights[t*4+i]}for(let t=0;t<e.triangles.length/3;t+=1){let n=(U+t)*4,r=t*3;B[n]=H+e.triangles[r],B[n+1]=H+e.triangles[r+1],B[n+2]=H+e.triangles[r+2]}H+=e.positions.length/3,U+=e.triangles.length/3}V[e.length]=H,te[e.length]=U;let W=new Uint32Array(F+1);for(let e=0;e<I;e+=1){let t=e*4;W[B[t]+1]+=1,W[B[t+1]+1]+=1,W[B[t+2]+1]+=1}for(let e=0;e<F;e+=1)W[e+1]+=W[e];let ne=new Uint32Array(I*3),re=W.slice(0,F);for(let e=0;e<I;e+=1){let t=e*4;for(let n=0;n<3;n+=1){let r=B[t+n];ne[re[r]++]=e}}let G=new Uint32Array(n+1);for(let e=0;e<a;e+=1){let t=e*4;G[g[t]+1]+=1,G[g[t+1]+1]+=1,G[g[t+2]+1]+=1}for(let e=0;e<n;e+=1)G[e+1]+=G[e];let ie=new Uint32Array(a*3),ae=G.slice(0,n);for(let e=0;e<a;e+=1){let t=e*4;for(let n=0;n<3;n+=1){let r=g[t+n];ie[ae[r]]=e,ae[r]+=1}}let oe=new Uint32Array(n+1),se=0;for(let e=0;e<n;e+=1)oe[e]=se,se+=m[e].length;oe[n]=se;let ce=new Uint32Array(se),le=0;for(let e of m)ce.set(e,le),le+=e.length;let K=N.reduce((e,t)=>Math.max(e,t.coloring.colorOffsets.length-1),0),ue=new Uint32Array(K),de=new Uint16Array(r);for(let t=0;t<e.length;t+=1){let e=N[t].coloring,n=D[t];de.set(e.tetrahedronColors,n);for(let t of e.tetrahedronColors)ue[t]+=1}let fe=new Uint32Array(K+1);for(let e=0;e<K;e+=1)fe[e+1]=fe[e]+ue[e];let pe=fe.slice(0,K),me=new Uint32Array(r);for(let t=0;t<e.length;t+=1){let e=N[t].coloring,n=D[t];for(let t=0;t<e.colorOffsets.length-1;t+=1)for(let r=e.colorOffsets[t];r<e.colorOffsets[t+1];r+=1)me[pe[t]]=n+e.orderedTetrahedra[r],pe[t]+=1}let he={orderedTetrahedra:me,colorOffsets:fe,tetrahedronColors:de},ge=Array.from({length:e.length},()=>Array.from({length:K},()=>[]));for(let e=0;e<K;e+=1)for(let t=he.colorOffsets[e];t<he.colorOffsets[e+1];t+=1)ge[T[he.orderedTetrahedra[t]]][e].push(t);let _e=new Uint32Array(e.length*(K+1)),ve=new Uint32Array(r),ye=0;for(let t=0;t<e.length;t+=1){let e=t*(K+1);for(let n=0;n<K;n+=1)_e[e+n]=ye,ve.set(ge[t][n],ye),ye+=ge[t][n].length;_e[e+K]=ye}let be=new ArrayBuffer(r*80),xe=new Uint32Array(be),q=new Float32Array(be),Se=new Float32Array(r*16),Ce=new Float32Array(r*36),we=new Float32Array(r*12),Te=new Uint32Array(r),Ee=new Uint32Array(r);for(let e=0;e<r;e+=1){let t=he.orderedTetrahedra[e],n=T[t];Te[e]=n,Ee[e]=t-D[n];let r=e*20;for(let e=0;e<4;e+=1)xe[r+e]=y[t*4+e];let i=b[t];q.set(i.slice(0,3),r+4),q.set(i.slice(3,6),r+8),q.set(i.slice(6,9),r+12),q[r+16]=x[t],q[r+17]=n,Se.set(S.subarray(t*16,t*16+16),e*16),Ce.set(C.subarray(t*36,t*36+36),e*36),we.set(w.subarray(t*12,t*12+12),e*12)}let De=new ArrayBuffer(v.length*32),Oe=new Uint32Array(De),ke=new Float32Array(De);for(let e=0;e<v.length;e+=1){let t=v[e],n=e*8;Oe[n]=t.negative,Oe[n+1]=t.positive,Oe[n+2]=t.maximumProjectionPasses,ke[n+4]=t.normal[0],ke[n+5]=t.normal[1],ke[n+6]=t.normal[2],ke[n+7]=t.targetSeparation}return{positions:c,velocities:l,vertexBodyIndices:u,surfaceComponentIndices:d,surfaceFlags:f,surfaceSelfContactFlags:p,selfContactExclusionOffsets:oe,selfContactExclusions:ce,surfaceVertices:h,surfaceTriangles:g,surfaceEdges:_,incidentSurfaceTriangleOffsets:G,incidentSurfaceTriangles:ie,renderPositions:L,renderPhysicsIndices:R,renderWeights:z,renderTriangles:B,renderIncidentTriangleOffsets:W,renderIncidentTriangles:ne,cutSurfacePairs:De,cutSurfacePairCount:v.length,tetrahedra:be,materials:Se,maxwellStates:Ce,plasticStates:we,coloring:he,elasticityClusterOffsets:_e,elasticityClusterTetrahedra:ve,bodyVertexOffsets:E,bodyRenderVertexOffsets:V,bodyRenderTriangleOffsets:te,bodyTetrahedronOffsets:D,tetrahedronBodyIndices:Te,tetrahedronLocalIndices:Ee,vertexCount:n,tetrahedronCount:r,surfaceVertexCount:i,surfaceTriangleCount:a,surfaceEdgeCount:o,renderVertexCount:F,renderTriangleCount:I,bodyCount:e.length,contactCellSize:Number.isFinite(s)?s*1.5:1,contactThickness:Number.isFinite(s)?s*.12:.01}}function Ne(e,t,n){for(let r=0;r<e.length;r+=1){let i=e[r],a=t.bodyVertexOffsets[r],o=t.bodyVertexOffsets[r+1];for(let e=a;e<o;e+=1){let t=(e-a)*3,r=e*4;i.positions[t]=n.positions[r],i.positions[t+1]=n.positions[r+1],i.positions[t+2]=n.positions[r+2],i.previousPositions[t]=n.previousPositions[r],i.previousPositions[t+1]=n.previousPositions[r+1],i.previousPositions[t+2]=n.previousPositions[r+2],i.velocities[t]=n.velocities[r],i.velocities[t+1]=n.velocities[r+1],i.velocities[t+2]=n.velocities[r+2]}}for(let r=0;r<t.tetrahedronCount;r+=1){let i=e[t.tetrahedronBodyIndices[r]],a=t.tetrahedronLocalIndices[r];for(let e=0;e<i.maxwellBranches.length&&e<3;e+=1){let t=r*36+e*12,o=a*9,s=i.maxwellBranches[e].viscousDeformations;s[o]=n.maxwellStates[t],s[o+1]=n.maxwellStates[t+1],s[o+2]=n.maxwellStates[t+2],s[o+3]=n.maxwellStates[t+4],s[o+4]=n.maxwellStates[t+5],s[o+5]=n.maxwellStates[t+6],s[o+6]=n.maxwellStates[t+8],s[o+7]=n.maxwellStates[t+9],s[o+8]=n.maxwellStates[t+10]}let o=r*12,s=a*9;i.plasticDeformations[s]=n.plasticStates[o],i.plasticDeformations[s+1]=n.plasticStates[o+1],i.plasticDeformations[s+2]=n.plasticStates[o+2],i.plasticDeformations[s+3]=n.plasticStates[o+4],i.plasticDeformations[s+4]=n.plasticStates[o+5],i.plasticDeformations[s+5]=n.plasticStates[o+6],i.plasticDeformations[s+6]=n.plasticStates[o+8],i.plasticDeformations[s+7]=n.plasticStates[o+9],i.plasticDeformations[s+8]=n.plasticStates[o+10]}}var Pe=new WeakMap,Fe=8,Ie=128*1024*1024,Le=8*1024*1024,Re=new WeakMap,ze=!0;function Be(e){ze=e}function Ve(){return ze}function He(e,t){return Math.ceil(e/t)*t}function Ue(e){let t=Math.min(Math.ceil(e*(e<=Le?2:1.25)),Ie);return Math.max(4,He(Math.max(e,t),256))}function We(e){let t=Pe.get(e);return t||(t={available:[]},Pe.set(e,t)),t}function Ge(e,t,n){let r=Math.max(4,He(t.byteLength,4));if(!a()||!ze){let i=e.createBuffer({size:r,usage:n,mappedAtCreation:!0});return t.byteLength>0&&new Uint8Array(i.getMappedRange()).set(new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),i.unmap(),i}let i=We(e),o=-1,s=1/0;for(let e=0;e<i.available.length;e+=1){let t=i.available[e];t.usage===n&&t.size>=r&&t.size<s&&(o=e,s=t.size)}let c;if(o>=0){let[n]=i.available.splice(o,1);c=n.buffer;let r=Re.get(c);r&&(r.released=!1),t.byteLength>0&&e.queue.writeBuffer(c,0,t)}else{let i=Ue(r);c=e.createBuffer({size:i,usage:n|Fe,mappedAtCreation:!0}),t.byteLength>0&&new Uint8Array(c.getMappedRange()).set(new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),c.unmap(),Re.set(c,{device:e,size:i,usage:n,released:!1})}return c}function J(e){let t=Re.get(e);if(!t){e.destroy();return}if(t.released)return;t.released=!0;let n=We(t.device);if(n.available.push({buffer:e,size:t.size,usage:t.usage}),n.available.length>128){n.available.sort((e,t)=>t.size-e.size);for(let e of n.available.splice(128))Re.delete(e.buffer),e.buffer.destroy()}}function Ke(e){let t=Pe.get(e);if(t){for(let e of t.available)Re.delete(e.buffer),e.buffer.destroy();t.available.length=0,Pe.delete(e)}}var qe=new WeakMap,Je=new WeakMap,Ye=1;function Xe(e){let t=Je.get(e);return t===void 0&&(t=Ye,Ye+=1,Je.set(e,t)),t}function Ze(e){let t=qe.get(e);return t||(t={modules:new Map,pipelines:new Map,bindGroups:new Map},qe.set(e,t)),t}async function Qe(e,t,n){let r=e.createShaderModule({code:n}),i=(await r.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(i.length>0)throw Error(`${t}: ${i.map(e=>`${e.lineNum}:${e.linePos} ${e.message}`).join(` | `)}`);return r}function $e(e,t,n){let r=Ze(e),i=r.modules.get(n);return i||(i=Qe(e,t,n),r.modules.set(n,i)),i}function Y(e,t,n,r){if(!a())return Qe(e,t,n).then(t=>e.createComputePipelineAsync({layout:`auto`,compute:{module:t,entryPoint:r}}));let i=Ze(e),o=`${n}\u0000${r}`,s=i.pipelines.get(o);return s||(s=$e(e,t,n).then(t=>e.createComputePipelineAsync({layout:`auto`,compute:{module:t,entryPoint:r}})),i.pipelines.set(o,s)),s}function X(e,t){let{cacheKey:n,...r}=t;if(!a())return e.createBindGroup(r);let i=Ze(e),o=t.layout,s=[Xe(n??o),...t.entries.map(e=>{let{binding:t,resource:n}=e;return`${t}:${Xe(n.buffer)}:${n.offset??0}:${n.size??0}`})].join(`|`),c=i.bindGroups.get(s);return c||(c=e.createBindGroup(r),i.bindGroups.set(s,c)),c}var et={COPY_SRC:4,COPY_DST:8,MAP_READ:1,STORAGE:128,UNIFORM:64},tt=1,nt=`
struct Params {
  releaseY: f32,
  vertexCount: u32,
  bodyCount: u32,
  _padding: u32,
}
@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> vertexBodies: array<u32>;
@group(0) @binding(2) var<storage, read_write> fallen: array<atomic<u32>>;
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(64)
fn clearFlags(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= params.bodyCount) { return; }
  atomicStore(&fallen[id.x], 1u);
}

@compute @workgroup_size(64)
fn classifyVertices(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertex = id.x;
  if (vertex >= params.vertexCount) { return; }
  if (positions[vertex].y >= params.releaseY) {
    atomicStore(&fallen[vertexBodies[vertex]], 0u);
  }
}
`;function rt(e,t,n){return Ge(e,t,n)}var it=class e{device;vertexCount;bodyCount;parametersBuffer;flagsBuffer;readbackBuffer;clearPipeline;classifyPipeline;clearGroup;classifyGroup;constructor(e,t,n,r,i,a,o,s,c,l){this.device=e,this.vertexCount=t,this.bodyCount=n,this.parametersBuffer=r,this.flagsBuffer=i,this.readbackBuffer=a,this.clearPipeline=o,this.classifyPipeline=s,this.clearGroup=c,this.classifyGroup=l}static async create(t,n,r,i,a){let[o,s]=await Promise.all([Y(t,`body-release WGSL`,nt,`clearFlags`),Y(t,`body-release WGSL`,nt,`classifyVertices`)]),c=rt(t,new Uint8Array(16),et.UNIFORM|et.COPY_DST),l=rt(t,new Uint32Array(a),et.STORAGE|et.COPY_SRC),u=t.createBuffer({size:Math.max(4,a*4),usage:et.MAP_READ|et.COPY_DST}),d=[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:r}},{binding:2,resource:{buffer:l}},{binding:3,resource:{buffer:c}}],f=X(t,{cacheKey:o,layout:o.getBindGroupLayout(0),entries:[{binding:2,resource:{buffer:l}},{binding:3,resource:{buffer:c}}]}),p=X(t,{cacheKey:s,layout:s.getBindGroupLayout(0),entries:d});return new e(t,i,a,c,l,u,o,s,f,p)}async readFlags(e){let t=new ArrayBuffer(16);new Float32Array(t)[0]=e,new Uint32Array(t)[1]=this.vertexCount,new Uint32Array(t)[2]=this.bodyCount,this.device.queue.writeBuffer(this.parametersBuffer,0,t);let n=this.device.createCommandEncoder(),r=n.beginComputePass();r.setPipeline(this.clearPipeline),r.setBindGroup(0,this.clearGroup),r.dispatchWorkgroups(Math.ceil(this.bodyCount/64)),r.end(),r=n.beginComputePass(),r.setPipeline(this.classifyPipeline),r.setBindGroup(0,this.classifyGroup),r.dispatchWorkgroups(Math.ceil(this.vertexCount/64)),r.end(),n.copyBufferToBuffer(this.flagsBuffer,0,this.readbackBuffer,0,this.bodyCount*4),this.device.queue.submit([n.finish()]),await this.readbackBuffer.mapAsync(tt);let i=new Uint32Array(this.readbackBuffer.getMappedRange()).slice();return this.readbackBuffer.unmap(),i}destroy(){J(this.parametersBuffer),J(this.flagsBuffer),this.readbackBuffer.destroy()}},Z={COPY_SRC:4,COPY_DST:8,MAP_READ:1,STORAGE:128,UNIFORM:64},at=`
struct ContactGlobals {
  vertexCount: u32,
  triangleCount: u32,
  bucketCount: u32,
  bucketCapacity: u32,
  adjacencyCapacity: u32,
  diagnostics: u32,
  exclusionCapacity: u32,
  wakeOffset: u32,
  cellSize: f32,
  thickness: f32,
  dt: f32,
  friction: f32,
}
struct HashEntry {
  cellAndIndex: vec4<i32>,
}
struct Contact {
  indices: vec4<u32>,
  delta0: vec4<f32>,
  delta1: vec4<f32>,
  delta2: vec4<f32>,
  delta3: vec4<f32>,
}
@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> previousPositions: array<vec4<f32>>;
// Triangles occupy [0, triangleCount); inter-body edges follow in the same
// buffer so both contact types share one swept spatial hash.
@group(0) @binding(2) var<storage, read> features: array<vec4<u32>>;
@group(0) @binding(4) var<storage, read_write> triangleEntries: array<HashEntry>;
@group(0) @binding(6) var<storage, read_write> contactState: array<atomic<u32>>;
@group(0) @binding(8) var<uniform> globals: ContactGlobals;

fn cellFor(position: vec3<f32>) -> vec3<i32> {
  return vec3<i32>(floor(position / globals.cellSize));
}

fn hashCell(cell: vec3<i32>) -> u32 {
  let value = (
    (bitcast<u32>(cell.x) * 73856093u)
    ^ (bitcast<u32>(cell.y) * 19349663u)
    ^ (bitcast<u32>(cell.z) * 83492791u)
  );
  return value & (globals.bucketCount - 1u);
}

@compute @workgroup_size(64)
fn clearHash(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x < globals.bucketCount) {
    atomicStore(&contactState[12u + globals.vertexCount + id.x], 0u);
  }
  if (id.x < globals.vertexCount) {
    atomicStore(&contactState[12u + id.x], 0u);
  }
  if (id.x < 12u) {
    atomicStore(&contactState[id.x], 0u);
  }
}

fn insertFeature(cell: vec3<i32>, featureIndex: u32) {
  let bucket = hashCell(cell);
  let slot = atomicAdd(&contactState[12u + globals.vertexCount + bucket], 1u);
  if (slot < globals.bucketCapacity) {
    triangleEntries[bucket * globals.bucketCapacity + slot].cellAndIndex = vec4<i32>(cell, i32(featureIndex));
    if (globals.diagnostics != 0u) { atomicAdd(&contactState[4], 1u); }
  } else {
    atomicAdd(&contactState[2], 1u);
  }
}

@compute @workgroup_size(64)
fn buildHash(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= arrayLength(&features)) { return; }
  let feature = features[id.x];
  let currentA = positions[feature.x].xyz;
  let currentB = positions[feature.y].xyz;
  var currentC = currentB;
  let previousA = previousPositions[feature.x].xyz;
  let previousB = previousPositions[feature.y].xyz;
  var previousC = previousB;
  if (id.x < globals.triangleCount) {
    currentC = positions[feature.z].xyz;
    previousC = previousPositions[feature.z].xyz;
  }
  let sweptMinimum = min(min(min(currentA, currentB), currentC), min(min(previousA, previousB), previousC));
  let sweptMaximum = max(max(max(currentA, currentB), currentC), max(max(previousA, previousB), previousC));
  var minimumCell = cellFor(sweptMinimum - vec3<f32>(globals.thickness));
  var maximumCell = cellFor(sweptMaximum + vec3<f32>(globals.thickness));
  let currentCentroidCell = cellFor(select(
    (currentA + currentB) * 0.5,
    (currentA + currentB + currentC) / 3.0,
    id.x < globals.triangleCount,
  ));
  // Bound pathological motion so one damaged element cannot monopolize a pass.
  minimumCell = max(minimumCell, currentCentroidCell - vec3<i32>(4));
  maximumCell = min(maximumCell, currentCentroidCell + vec3<i32>(4));
  for (var z = minimumCell.z; z <= maximumCell.z; z += 1i) {
    for (var y = minimumCell.y; y <= maximumCell.y; y += 1i) {
      for (var x = minimumCell.x; x <= maximumCell.x; x += 1i) {
        insertFeature(vec3<i32>(x, y, z), id.x);
      }
    }
  }
}
`,ot=`
struct ContactGlobals {
  vertexCount: u32,
  triangleCount: u32,
  bucketCount: u32,
  bucketCapacity: u32,
  adjacencyCapacity: u32,
  diagnostics: u32,
  exclusionCapacity: u32,
  wakeOffset: u32,
  cellSize: f32,
  thickness: f32,
  dt: f32,
  friction: f32,
}
struct HashEntry {
  cellAndIndex: vec4<i32>,
}
struct Contact {
  indices: vec4<u32>,
  delta0: vec4<f32>,
  delta1: vec4<f32>,
  delta2: vec4<f32>,
  delta3: vec4<f32>,
}
@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> previousPositions: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> surfaceMetadata: array<vec4<u32>>;
@group(0) @binding(3) var<storage, read> features: array<vec4<u32>>;
@group(0) @binding(4) var<storage, read> triangleEntries: array<HashEntry>;
@group(0) @binding(5) var<storage, read_write> contacts: array<Contact>;
@group(0) @binding(6) var<storage, read_write> contactState: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read_write> adjacencyEntries: array<u32>;
@group(0) @binding(8) var<uniform> globals: ContactGlobals;

fn cellFor(position: vec3<f32>) -> vec3<i32> {
  return vec3<i32>(floor(position / globals.cellSize));
}

fn hashCell(cell: vec3<i32>) -> u32 {
  let value = (
    (bitcast<u32>(cell.x) * 73856093u)
    ^ (bitcast<u32>(cell.y) * 19349663u)
    ^ (bitcast<u32>(cell.z) * 83492791u)
  );
  return value & (globals.bucketCount - 1u);
}

fn registerContribution(vertex: u32, encodedContribution: u32) {
  let slot = atomicAdd(&contactState[12u + vertex], 1u);
  if (slot < globals.adjacencyCapacity) {
    adjacencyEntries[vertex * adjacencyStride() + slot] = encodedContribution;
    if (globals.diagnostics != 0u) { atomicAdd(&contactState[5], 1u); }
  } else {
    atomicAdd(&contactState[3], 1u);
  }
}

fn adjacencyStride() -> u32 {
  return globals.adjacencyCapacity + globals.exclusionCapacity;
}

fn containsSelfContactExclusion(pointVertex: u32, candidate: u32, count: u32) -> bool {
  let base = pointVertex * adjacencyStride() + globals.adjacencyCapacity;
  var low = 0u;
  var high = count;
  loop {
    if (low >= high) { break; }
    let middle = low + (high - low) / 2u;
    let value = adjacencyEntries[base + middle];
    if (value < candidate) {
      low = middle + 1u;
    } else {
      high = middle;
    }
  }
  return low < count && adjacencyEntries[base + low] == candidate;
}

fn isSelfContactExcluded(pointVertex: u32, triangle: vec4<u32>) -> bool {
  let pointMetadata = surfaceMetadata[pointVertex];
  return (
    containsSelfContactExclusion(pointVertex, triangle.x, pointMetadata.w)
    || containsSelfContactExclusion(pointVertex, triangle.y, pointMetadata.w)
    || containsSelfContactExclusion(pointVertex, triangle.z, pointMetadata.w)
  );
}

@compute @workgroup_size(64)
fn generateContacts(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= globals.vertexCount || surfaceMetadata[id.x].x == 0u) { return; }
  let pointVertex = id.x;
  let pointMetadata = surfaceMetadata[pointVertex];
  let pointBody = pointMetadata.x - 1u;
  if (atomicLoad(&contactState[globals.wakeOffset + pointBody]) == 0u) { return; }
  let point = positions[pointVertex];
  let pointPrevious = previousPositions[pointVertex];
  let invalid = 0xffffffffu;
  contacts[pointVertex].indices = vec4<u32>(invalid);
  contacts[pointVertex].delta0 = vec4<f32>(0.0);
  contacts[pointVertex].delta1 = vec4<f32>(0.0);
  contacts[pointVertex].delta2 = vec4<f32>(0.0);
  contacts[pointVertex].delta3 = vec4<f32>(0.0);

  var minimumCell = cellFor(min(point.xyz, pointPrevious.xyz) - vec3<f32>(globals.thickness));
  var maximumCell = cellFor(max(point.xyz, pointPrevious.xyz) + vec3<f32>(globals.thickness));
  let currentPointCell = cellFor(point.xyz);
  minimumCell = max(minimumCell, currentPointCell - vec3<i32>(4));
  maximumCell = min(maximumCell, currentPointCell + vec3<i32>(4));
  var bestSeparation = globals.thickness;
  var bestAbsoluteSeparation = globals.thickness;
  var bestPreviousSeparation = globals.thickness;
  var bestSweptCrossing = false;
  var bestTriangle = vec4<u32>(invalid);
  var bestBarycentric = vec3<f32>(0.0);
  var bestNormal = vec3<f32>(0.0);
  for (var z = minimumCell.z; z <= maximumCell.z; z += 1i) {
    for (var y = minimumCell.y; y <= maximumCell.y; y += 1i) {
      for (var x = minimumCell.x; x <= maximumCell.x; x += 1i) {
        let cell = vec3<i32>(x, y, z);
        let bucket = hashCell(cell);
        let count = min(
          atomicLoad(&contactState[12u + globals.vertexCount + bucket]),
          globals.bucketCapacity,
        );
        for (var slot = 0u; slot < count; slot += 1u) {
          let entry = triangleEntries[bucket * globals.bucketCapacity + slot].cellAndIndex;
          if (!all(entry.xyz == cell)) { continue; }
          if (u32(entry.w) >= globals.triangleCount) { continue; }
          if (globals.diagnostics != 0u) { atomicAdd(&contactState[6], 1u); }
          let triangle = features[u32(entry.w)];
          let sameComponent = (triangle.w & 0x7fffffffu) == pointMetadata.z;
          if (sameComponent) {
            if (
              pointMetadata.y == 0u
              || (triangle.w & 0x80000000u) == 0u
            ) { continue; }
          }
          if (globals.diagnostics != 0u) { atomicAdd(&contactState[1], 1u); }
          let a = positions[triangle.x].xyz;
          let ab = positions[triangle.y].xyz - a;
          let ac = positions[triangle.z].xyz - a;
          let rawNormal = cross(ab, ac);
          let normalLength = length(rawNormal);
          if (!(normalLength > 1e-8)) { continue; }
          let normal = rawNormal / normalLength;
          let ap = point.xyz - a;
          let separation = dot(ap, normal);
          if (separation >= globals.thickness) { continue; }
          let projected = ap - separation * normal;
          let dot00 = dot(ab, ab);
          let dot01 = dot(ab, ac);
          let dot11 = dot(ac, ac);
          let dot20 = dot(projected, ab);
          let dot21 = dot(projected, ac);
          let denominator = dot00 * dot11 - dot01 * dot01;
          if (!(abs(denominator) > 1e-12)) { continue; }
          let weightB = (dot11 * dot20 - dot01 * dot21) / denominator;
          let weightC = (dot00 * dot21 - dot01 * dot20) / denominator;
          let weightA = 1.0 - weightB - weightC;
          if (min(weightA, min(weightB, weightC)) < -0.015) { continue; }
          if (sameComponent && isSelfContactExcluded(pointVertex, triangle)) { continue; }
          let previousA = previousPositions[triangle.x].xyz;
          let previousB = previousPositions[triangle.y].xyz;
          let previousC = previousPositions[triangle.z].xyz;
          let previousRawNormal = cross(previousB - previousA, previousC - previousA);
          let previousNormalLength = length(previousRawNormal);
          if (!(previousNormalLength > 1e-8)) { continue; }
          let previousNormal = previousRawNormal / previousNormalLength;
          let previousTrianglePoint = (
            weightA * previousA + weightB * previousB + weightC * previousC
          );
          let previousSeparation = dot(pointPrevious.xyz - previousTrianglePoint, previousNormal);
          let sweptCrossing = previousSeparation >= globals.thickness && separation < globals.thickness;
          if (sameComponent) {
            if (separation < -globals.thickness * 1.8 && !sweptCrossing) { continue; }
            if (bestTriangle.x != invalid && separation >= bestSeparation) { continue; }
          } else {
            // Different bodies and disconnected cut pieces must recover even
            // after a previous pass left a point deeper than the contact shell.
            // Choose the nearest face instead of the most negative plane so a
            // contained point moves toward the closest exit surface.
            let absoluteSeparation = abs(separation);
            if (bestSweptCrossing && !sweptCrossing) { continue; }
            if (
              sweptCrossing == bestSweptCrossing
              && bestTriangle.x != invalid
              && absoluteSeparation >= bestAbsoluteSeparation
            ) { continue; }
            bestAbsoluteSeparation = absoluteSeparation;
          }
          bestSeparation = separation;
          bestPreviousSeparation = previousSeparation;
          bestSweptCrossing = sweptCrossing;
          bestTriangle = triangle;
          bestBarycentric = vec3<f32>(weightA, weightB, weightC);
          bestNormal = normal;
        }
      }
    }
  }
  if (bestTriangle.x == invalid) { return; }
  let triangleA = positions[bestTriangle.x];
  let triangleB = positions[bestTriangle.y];
  let triangleC = positions[bestTriangle.z];
  let denominator = (
    point.w
    + triangleA.w * bestBarycentric.x * bestBarycentric.x
    + triangleB.w * bestBarycentric.y * bestBarycentric.y
    + triangleC.w * bestBarycentric.z * bestBarycentric.z
  );
  if (!(denominator > 1e-12)) { return; }
  let initialPenetration = max(globals.thickness - bestPreviousSeparation, 0.0);
  let retainedPenetration = max(initialPenetration - 2.5 * globals.dt, 0.0);
  let constraintValue = bestSeparation - globals.thickness + retainedPenetration;
  if (constraintValue >= 0.0) { return; }
  // A swept crossing must return to the contact plane in this substep.
  // Otherwise the regular cap can leave it beyond the narrow-phase search
  // depth, causing the next substep to discard the contact permanently.
  let correctionDepth = select(
    min(-constraintValue, 2.5 * globals.dt),
    -constraintValue,
    bestPreviousSeparation >= globals.thickness && bestSeparation < globals.thickness,
  );
  let deltaLambda = correctionDepth / denominator;
  var pointDelta = point.w * bestNormal * deltaLambda;
  var triangleDeltaA = -triangleA.w * bestBarycentric.x * bestNormal * deltaLambda;
  var triangleDeltaB = -triangleB.w * bestBarycentric.y * bestNormal * deltaLambda;
  var triangleDeltaC = -triangleC.w * bestBarycentric.z * bestNormal * deltaLambda;
  let relativeDisplacement = (
    (point.xyz + pointDelta - pointPrevious.xyz)
    - bestBarycentric.x * (triangleA.xyz + triangleDeltaA - previousPositions[bestTriangle.x].xyz)
    - bestBarycentric.y * (triangleB.xyz + triangleDeltaB - previousPositions[bestTriangle.y].xyz)
    - bestBarycentric.z * (triangleC.xyz + triangleDeltaC - previousPositions[bestTriangle.z].xyz)
  );
  let tangent = relativeDisplacement - dot(relativeDisplacement, bestNormal) * bestNormal;
  let tangentLength = length(tangent);
  if (tangentLength > 1e-10) {
    let tangentLambda = min(tangentLength / denominator, globals.friction * deltaLambda);
    if (tangentLambda > 1e-10) {
      let frictionDirection = -tangent / tangentLength;
      pointDelta += point.w * frictionDirection * tangentLambda;
      triangleDeltaA -= triangleA.w * bestBarycentric.x * frictionDirection * tangentLambda;
      triangleDeltaB -= triangleB.w * bestBarycentric.y * frictionDirection * tangentLambda;
      triangleDeltaC -= triangleC.w * bestBarycentric.z * frictionDirection * tangentLambda;
      atomicAdd(&contactState[9], 1u);
    }
  }
  contacts[pointVertex].indices = vec4<u32>(pointVertex, bestTriangle.x, bestTriangle.y, bestTriangle.z);
  contacts[pointVertex].delta0 = vec4<f32>(pointDelta, 0.0);
  contacts[pointVertex].delta1 = vec4<f32>(triangleDeltaA, 0.0);
  contacts[pointVertex].delta2 = vec4<f32>(triangleDeltaB, 0.0);
  contacts[pointVertex].delta3 = vec4<f32>(triangleDeltaC, 0.0);
  registerContribution(pointVertex, pointVertex * 4u);
  registerContribution(bestTriangle.x, pointVertex * 4u + 1u);
  registerContribution(bestTriangle.y, pointVertex * 4u + 2u);
  registerContribution(bestTriangle.z, pointVertex * 4u + 3u);
  atomicAdd(&contactState[0], 1u);
  let triangleBody = surfaceMetadata[bestTriangle.x].x - 1u;
  let closingSpeed = max((bestPreviousSeparation - bestSeparation) / globals.dt, 0.0);
  // CONTACT_THICKNESS_FACTOR is 0.12 while the settled penetration budget is
  // 0.008 particle radii. Do not let either participant sleep while a contact
  // still needs a visible correction; otherwise the elastic solve is skipped
  // and an interlocked pair can become permanently frozen.
  let unsettled = (
    globals.thickness - bestSeparation > globals.thickness / 15.0
    || closingSpeed > 0.035
  );
  if (unsettled) {
    atomicMax(&contactState[globals.wakeOffset + pointBody], 2u);
    atomicMax(&contactState[globals.wakeOffset + triangleBody], 2u);
  }
  if (triangleBody == pointBody) {
    atomicAdd(&contactState[7], 1u);
  }
  if (bestPreviousSeparation >= globals.thickness && bestSeparation < globals.thickness) {
    atomicAdd(&contactState[8], 1u);
  }
}

struct SegmentContact {
  parameters: vec2<f32>,
  firstPoint: vec3<f32>,
  secondPoint: vec3<f32>,
}

fn closestSegmentPoints(
  firstA: vec3<f32>,
  firstB: vec3<f32>,
  secondA: vec3<f32>,
  secondB: vec3<f32>,
) -> SegmentContact {
  let firstDirection = firstB - firstA;
  let secondDirection = secondB - secondA;
  let offset = firstA - secondA;
  let firstLengthSquared = dot(firstDirection, firstDirection);
  let secondLengthSquared = dot(secondDirection, secondDirection);
  let secondOffsetDot = dot(secondDirection, offset);
  var firstParameter = 0.0;
  var secondParameter = 0.0;
  if (firstLengthSquared <= 1e-12) {
    secondParameter = clamp(secondOffsetDot / secondLengthSquared, 0.0, 1.0);
  } else {
    let firstOffsetDot = dot(firstDirection, offset);
    if (secondLengthSquared <= 1e-12) {
      firstParameter = clamp(-firstOffsetDot / firstLengthSquared, 0.0, 1.0);
    } else {
      let directionsDot = dot(firstDirection, secondDirection);
      let denominator = firstLengthSquared * secondLengthSquared - directionsDot * directionsDot;
      if (abs(denominator) > 1e-12) {
        firstParameter = clamp(
          (directionsDot * secondOffsetDot - firstOffsetDot * secondLengthSquared) / denominator,
          0.0,
          1.0,
        );
      }
      secondParameter = (directionsDot * firstParameter + secondOffsetDot) / secondLengthSquared;
      if (secondParameter < 0.0) {
        secondParameter = 0.0;
        firstParameter = clamp(-firstOffsetDot / firstLengthSquared, 0.0, 1.0);
      } else if (secondParameter > 1.0) {
        secondParameter = 1.0;
        firstParameter = clamp(
          (directionsDot - firstOffsetDot) / firstLengthSquared,
          0.0,
          1.0,
        );
      }
    }
  }
  return SegmentContact(
    vec2<f32>(firstParameter, secondParameter),
    mix(firstA, firstB, firstParameter),
    mix(secondA, secondB, secondParameter),
  );
}

@compute @workgroup_size(64)
fn generateEdgeContacts(@builtin(global_invocation_id) id: vec3<u32>) {
  let featureIndex = globals.triangleCount + id.x;
  if (featureIndex >= arrayLength(&features)) { return; }
  let edge = features[featureIndex];
  let edgeBody = edge.z;
  if (atomicLoad(&contactState[globals.wakeOffset + edgeBody]) == 0u) { return; }
  let firstA = positions[edge.x].xyz;
  let firstB = positions[edge.y].xyz;
  let previousFirstA = previousPositions[edge.x].xyz;
  let previousFirstB = previousPositions[edge.y].xyz;
  if (length(firstB - firstA) <= 1e-8) { return; }

  let recordIndex = globals.vertexCount + id.x;
  let invalid = 0xffffffffu;
  contacts[recordIndex].indices = vec4<u32>(invalid);
  contacts[recordIndex].delta0 = vec4<f32>(0.0);
  contacts[recordIndex].delta1 = vec4<f32>(0.0);
  contacts[recordIndex].delta2 = vec4<f32>(0.0);
  contacts[recordIndex].delta3 = vec4<f32>(0.0);

  let sweptMinimum = min(min(firstA, firstB), min(previousFirstA, previousFirstB));
  let sweptMaximum = max(max(firstA, firstB), max(previousFirstA, previousFirstB));
  var minimumCell = cellFor(sweptMinimum - vec3<f32>(globals.thickness));
  var maximumCell = cellFor(sweptMaximum + vec3<f32>(globals.thickness));
  let midpointCell = cellFor((firstA + firstB) * 0.5);
  minimumCell = max(minimumCell, midpointCell - vec3<i32>(4));
  maximumCell = min(maximumCell, midpointCell + vec3<i32>(4));

  var bestDistance = globals.thickness;
  var bestPreviousDistance = globals.thickness;
  var bestParameters = vec2<f32>(0.0);
  var bestNormal = vec3<f32>(0.0);
  var bestEdge = vec4<u32>(invalid);
  for (var z = minimumCell.z; z <= maximumCell.z; z += 1i) {
    for (var y = minimumCell.y; y <= maximumCell.y; y += 1i) {
      for (var x = minimumCell.x; x <= maximumCell.x; x += 1i) {
        let cell = vec3<i32>(x, y, z);
        let bucket = hashCell(cell);
        let count = min(
          atomicLoad(&contactState[12u + globals.vertexCount + bucket]),
          globals.bucketCapacity,
        );
        for (var slot = 0u; slot < count; slot += 1u) {
          let entry = triangleEntries[bucket * globals.bucketCapacity + slot].cellAndIndex;
          if (!all(entry.xyz == cell)) { continue; }
          let candidateFeatureIndex = u32(entry.w);
          if (
            candidateFeatureIndex == featureIndex
            || candidateFeatureIndex < globals.triangleCount
          ) { continue; }
          let candidate = features[candidateFeatureIndex];
          if (candidate.w == edge.w) { continue; }
          // Process an awake pair once. If the lower-index edge is sleeping,
          // the higher-index active edge still owns the pair and can wake it.
          if (
            candidateFeatureIndex < featureIndex
            && atomicLoad(&contactState[globals.wakeOffset + candidate.z]) != 0u
          ) { continue; }
          if (globals.diagnostics != 0u) {
            atomicAdd(&contactState[1], 1u);
            atomicAdd(&contactState[6], 1u);
            atomicAdd(&contactState[11], 1u);
          }
          let secondA = positions[candidate.x].xyz;
          let secondB = positions[candidate.y].xyz;
          if (length(secondB - secondA) <= 1e-8) { continue; }
          let contact = closestSegmentPoints(firstA, firstB, secondA, secondB);
          let difference = contact.firstPoint - contact.secondPoint;
          let distance = length(difference);
          if (distance >= bestDistance) { continue; }

          let previousSecondA = previousPositions[candidate.x].xyz;
          let previousSecondB = previousPositions[candidate.y].xyz;
          let previousFirstPoint = mix(previousFirstA, previousFirstB, contact.parameters.x);
          let previousSecondPoint = mix(previousSecondA, previousSecondB, contact.parameters.y);
          let previousDifference = previousFirstPoint - previousSecondPoint;
          let previousDistance = length(previousDifference);
          var normal = vec3<f32>(0.0);
          if (distance > 1e-8) {
            normal = difference / distance;
          } else if (previousDistance > 1e-8) {
            normal = previousDifference / previousDistance;
          } else {
            let perpendicular = cross(firstB - firstA, secondB - secondA);
            let perpendicularLength = length(perpendicular);
            if (!(perpendicularLength > 1e-8)) { continue; }
            normal = perpendicular / perpendicularLength;
          }
          bestDistance = distance;
          bestPreviousDistance = previousDistance;
          bestParameters = contact.parameters;
          bestNormal = normal;
          bestEdge = candidate;
        }
      }
    }
  }
  if (bestEdge.x == invalid) { return; }

  let firstWeights = vec2<f32>(1.0 - bestParameters.x, bestParameters.x);
  let secondWeights = vec2<f32>(1.0 - bestParameters.y, bestParameters.y);
  let firstPositionA = positions[edge.x];
  let firstPositionB = positions[edge.y];
  let secondPositionA = positions[bestEdge.x];
  let secondPositionB = positions[bestEdge.y];
  let denominator = (
    firstPositionA.w * firstWeights.x * firstWeights.x
    + firstPositionB.w * firstWeights.y * firstWeights.y
    + secondPositionA.w * secondWeights.x * secondWeights.x
    + secondPositionB.w * secondWeights.y * secondWeights.y
  );
  if (!(denominator > 1e-12)) { return; }
  let initialPenetration = max(globals.thickness - bestPreviousDistance, 0.0);
  let retainedPenetration = max(initialPenetration - 2.5 * globals.dt, 0.0);
  let constraintValue = bestDistance - globals.thickness + retainedPenetration;
  if (constraintValue >= 0.0) { return; }
  let correctionDepth = min(-constraintValue, 2.5 * globals.dt);
  let deltaLambda = correctionDepth / denominator;
  // The shared Jacobi gather averages every contribution incident to a
  // vertex. Edge crossings occur in dense face patches, so compensate for
  // that dilution without adding another contact iteration/pass.
  let edgeRelaxation = 4.0;
  let firstDeltaA = edgeRelaxation * firstPositionA.w * firstWeights.x * bestNormal * deltaLambda;
  let firstDeltaB = edgeRelaxation * firstPositionB.w * firstWeights.y * bestNormal * deltaLambda;
  let secondDeltaA = -edgeRelaxation * secondPositionA.w * secondWeights.x * bestNormal * deltaLambda;
  let secondDeltaB = -edgeRelaxation * secondPositionB.w * secondWeights.y * bestNormal * deltaLambda;

  contacts[recordIndex].indices = vec4<u32>(edge.x, edge.y, bestEdge.x, bestEdge.y);
  contacts[recordIndex].delta0 = vec4<f32>(firstDeltaA, 0.0);
  contacts[recordIndex].delta1 = vec4<f32>(firstDeltaB, 0.0);
  contacts[recordIndex].delta2 = vec4<f32>(secondDeltaA, 0.0);
  contacts[recordIndex].delta3 = vec4<f32>(secondDeltaB, 0.0);
  registerContribution(edge.x, recordIndex * 4u);
  registerContribution(edge.y, recordIndex * 4u + 1u);
  registerContribution(bestEdge.x, recordIndex * 4u + 2u);
  registerContribution(bestEdge.y, recordIndex * 4u + 3u);
  atomicAdd(&contactState[0], 1u);
  atomicAdd(&contactState[10], 1u);

  let otherBody = bestEdge.z;
  let closingSpeed = max((bestPreviousDistance - bestDistance) / globals.dt, 0.0);
  if (
    globals.thickness - bestDistance > globals.thickness / 15.0
    || closingSpeed > 0.035
  ) {
    atomicMax(&contactState[globals.wakeOffset + edgeBody], 2u);
    atomicMax(&contactState[globals.wakeOffset + otherBody], 2u);
  }
}
`,st=`
struct ContactGlobals {
  vertexCount: u32,
  triangleCount: u32,
  bucketCount: u32,
  bucketCapacity: u32,
  adjacencyCapacity: u32,
  diagnostics: u32,
  exclusionCapacity: u32,
  wakeOffset: u32,
  cellSize: f32,
  thickness: f32,
  dt: f32,
  friction: f32,
}
struct Contact {
  indices: vec4<u32>,
  delta0: vec4<f32>,
  delta1: vec4<f32>,
  delta2: vec4<f32>,
  delta3: vec4<f32>,
}
@group(0) @binding(0) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> surfaceMetadata: array<vec4<u32>>;
@group(0) @binding(5) var<storage, read> contacts: array<Contact>;
@group(0) @binding(6) var<storage, read_write> contactState: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read> adjacencyEntries: array<u32>;
@group(0) @binding(8) var<uniform> globals: ContactGlobals;

@compute @workgroup_size(64)
fn aggregateContacts(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= globals.vertexCount || surfaceMetadata[id.x].x == 0u) { return; }
  let vertex = id.x;
  let body = surfaceMetadata[vertex].x - 1u;
  if (atomicLoad(&contactState[globals.wakeOffset + body]) == 0u) { return; }
  var position = positions[vertex];
  var directCorrection = vec3<f32>(0.0);
  var correction = vec3<f32>(0.0);
  var averagedContributionCount = 0u;
  let contributionCount = min(atomicLoad(&contactState[12u + vertex]), globals.adjacencyCapacity);
  for (var slot = 0u; slot < contributionCount; slot += 1u) {
    let encoded = adjacencyEntries[
      vertex * (globals.adjacencyCapacity + globals.exclusionCapacity) + slot
    ];
    let contactIndex = encoded / 4u;
    let contact = contacts[contactIndex];
    let corner = encoded & 3u;
    if (contactIndex < globals.vertexCount && corner == 0u) {
      // Each surface point owns at most one point-triangle constraint. Applying
      // its crossing correction directly prevents unrelated triangle/edge
      // contributions from averaging it away after a fast impact.
      directCorrection += contact.delta0.xyz;
    } else if (corner == 0u) {
      correction += contact.delta0.xyz;
    } else if (corner == 1u) {
      correction += contact.delta1.xyz;
    } else if (corner == 2u) {
      correction += contact.delta2.xyz;
    } else {
      correction += contact.delta3.xyz;
    }
    if (!(contactIndex < globals.vertexCount && corner == 0u)) {
      averagedContributionCount += 1u;
    }
  }
  if (contributionCount > 0u) {
    var delta = directCorrection * 0.98;
    if (averagedContributionCount > 0u) {
      delta += correction * (0.9 / f32(averagedContributionCount));
    }
    position = vec4<f32>(position.xyz + delta, position.w);
    positions[vertex] = position;
  }
}
`;function ct(e){let t=1;for(;t<e;)t*=2;return t}var lt=32768;function ut(e){return Math.min(lt,ct(Math.max(64,e*8)))}function dt(e,t,n){return Ge(e,t,n)}var ft=class e{static PASS_COUNT=5;device;data;bucketCount;buffers;countersBuffer;wakeOffset;clearPipeline;buildPipeline;generatePipeline;generateEdgePipeline;aggregatePipeline;clearGroup;buildGroup;diagnosticBuildGroup;generateGroup;diagnosticGenerateGroup;generateEdgeGroup;diagnosticGenerateEdgeGroup;aggregateGroup;constructor(e,t,n,r,i,a,o,s){this.device=e,this.data=t,this.bucketCount=n,this.buffers=r,this.countersBuffer=i,this.wakeOffset=a,this.clearPipeline=o[0],this.buildPipeline=o[1],this.generatePipeline=o[2],this.generateEdgePipeline=o[3],this.aggregatePipeline=o[4],this.clearGroup=s[0],this.buildGroup=s[1],this.diagnosticBuildGroup=s[2],this.generateGroup=s[3],this.diagnosticGenerateGroup=s[4],this.generateEdgeGroup=s[5],this.diagnosticGenerateEdgeGroup=s[6],this.aggregateGroup=s[7]}static async create(t,n,r,i,a){let o=n.surfaceTriangleCount+n.surfaceEdgeCount,s=ut(o),c=0;for(let e=0;e<n.vertexCount;e+=1)c=Math.max(c,n.selfContactExclusionOffsets[e+1]-n.selfContactExclusionOffsets[e]);let l=ct(Math.max(32,c)),u=12+n.vertexCount+s,d=new Uint32Array(n.vertexCount*4),f=new Uint32Array(n.vertexCount*(48+l));for(let e=0;e<n.vertexCount;e+=1){let t=n.selfContactExclusionOffsets[e],r=n.selfContactExclusionOffsets[e+1],i=r-t;d[e*4]=n.surfaceFlags[e],d[e*4+1]=n.surfaceSelfContactFlags[e],d[e*4+2]=n.surfaceComponentIndices[e],d[e*4+3]=i,f.set(n.selfContactExclusions.subarray(t,r),e*(48+l)+48)}let p=dt(t,d,Z.STORAGE),m=new Uint32Array(o*4);m.set(n.surfaceTriangles),m.set(n.surfaceEdges,n.surfaceTriangles.length);let h=dt(t,m,Z.STORAGE),g=dt(t,new Int32Array(s*160*4),Z.STORAGE),_=dt(t,new Uint32Array((n.vertexCount+n.surfaceEdgeCount)*20),Z.STORAGE),v=dt(t,new Uint32Array(u+n.bodyCount),Z.STORAGE|Z.COPY_SRC),y=dt(t,f,Z.STORAGE),b=e=>{let r=new ArrayBuffer(48),i=new Uint32Array(r),o=new Float32Array(r);return i[0]=n.vertexCount,i[1]=n.surfaceTriangleCount,i[2]=s,i[3]=160,i[4]=48,i[5]=+!!e,i[6]=l,i[7]=u,o[8]=n.contactCellSize,o[9]=n.contactThickness,o[10]=a,o[11]=.18,dt(t,new Uint8Array(r),Z.UNIFORM)},x=b(!1),S=b(!0),[C,w,T,E,D]=await Promise.all([Y(t,`contact hash WGSL`,at,`clearHash`),Y(t,`contact hash WGSL`,at,`buildHash`),Y(t,`contact generation WGSL`,ot,`generateContacts`),Y(t,`contact generation WGSL`,ot,`generateEdgeContacts`),Y(t,`contact aggregation WGSL`,st,`aggregateContacts`)]),O=X(t,{cacheKey:C,layout:C.getBindGroupLayout(0),entries:[{binding:6,resource:{buffer:v}},{binding:8,resource:{buffer:x}}]}),k=e=>[{binding:0,resource:{buffer:r}},{binding:1,resource:{buffer:i}},{binding:2,resource:{buffer:h}},{binding:4,resource:{buffer:g}},{binding:6,resource:{buffer:v}},{binding:8,resource:{buffer:e}}],A=X(t,{cacheKey:w,layout:w.getBindGroupLayout(0),entries:k(x)}),j=X(t,{cacheKey:w,layout:w.getBindGroupLayout(0),entries:k(S)}),M=e=>[{binding:0,resource:{buffer:r}},{binding:1,resource:{buffer:i}},{binding:2,resource:{buffer:p}},{binding:3,resource:{buffer:h}},{binding:4,resource:{buffer:g}},{binding:5,resource:{buffer:_}},{binding:6,resource:{buffer:v}},{binding:7,resource:{buffer:y}},{binding:8,resource:{buffer:e}}],ee=X(t,{cacheKey:T,layout:T.getBindGroupLayout(0),entries:M(x)}),N=X(t,{cacheKey:T,layout:T.getBindGroupLayout(0),entries:M(S)}),P=e=>[{binding:0,resource:{buffer:r}},{binding:1,resource:{buffer:i}},{binding:3,resource:{buffer:h}},{binding:4,resource:{buffer:g}},{binding:5,resource:{buffer:_}},{binding:6,resource:{buffer:v}},{binding:7,resource:{buffer:y}},{binding:8,resource:{buffer:e}}],F=X(t,{cacheKey:E,layout:E.getBindGroupLayout(0),entries:P(x)}),I=X(t,{cacheKey:E,layout:E.getBindGroupLayout(0),entries:P(S)}),L=X(t,{cacheKey:D,layout:D.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r}},{binding:1,resource:{buffer:p}},{binding:5,resource:{buffer:_}},{binding:6,resource:{buffer:v}},{binding:7,resource:{buffer:y}},{binding:8,resource:{buffer:x}}]});return new e(t,n,s,[p,h,g,_,v,y,x,S],v,u,[C,w,T,E,D],[O,A,j,ee,N,F,I,L])}get stateBuffer(){return this.countersBuffer}encode(e,t=!1,n=[]){let r=e.beginComputePass(n[0]);r.setPipeline(this.clearPipeline),r.setBindGroup(0,this.clearGroup),r.dispatchWorkgroups(Math.ceil(Math.max(this.bucketCount,this.data.vertexCount)/64)),r.end(),r=e.beginComputePass(n[1]),r.setPipeline(this.buildPipeline),r.setBindGroup(0,t?this.diagnosticBuildGroup:this.buildGroup),r.dispatchWorkgroups(Math.ceil((this.data.surfaceTriangleCount+this.data.surfaceEdgeCount)/64)),r.end(),r=e.beginComputePass(n[2]),r.setPipeline(this.generatePipeline),r.setBindGroup(0,t?this.diagnosticGenerateGroup:this.generateGroup),r.dispatchWorkgroups(Math.ceil(this.data.vertexCount/64)),r.end(),r=e.beginComputePass(n[3]),r.setPipeline(this.generateEdgePipeline),r.setBindGroup(0,t?this.diagnosticGenerateEdgeGroup:this.generateEdgeGroup),r.dispatchWorkgroups(Math.ceil(this.data.surfaceEdgeCount/64)),r.end(),r=e.beginComputePass(n[4]),r.setPipeline(this.aggregatePipeline),r.setBindGroup(0,this.aggregateGroup),r.dispatchWorkgroups(Math.ceil(this.data.vertexCount/64)),r.end()}async readMetrics(){let e=this.device.createBuffer({size:48,usage:Z.MAP_READ|Z.COPY_DST});try{let t=this.device.createCommandEncoder();t.copyBufferToBuffer(this.countersBuffer,0,e,0,48),this.device.queue.submit([t.finish()]),await e.mapAsync(1);let n=new Uint32Array(e.getMappedRange());return{contacts:n[0],edgeContacts:n[10],edgeCandidates:n[11],selfContacts:n[7],sweptContacts:n[8],frictionContacts:n[9],candidates:n[1],triangleOverflows:n[2],adjacencyOverflows:n[3],triangleInserts:n[4],adjacencyInserts:n[5],hashMatches:n[6]}}finally{e.unmap(),e.destroy()}}destroy(){for(let e of this.buffers)J(e)}},pt={COPY_DST:8,STORAGE:128,UNIFORM:64},mt=`
struct Params {
  delta: vec4<f32>,
  grabTarget: vec4<f32>,
  releaseVelocity: vec4<f32>,
  control: vec4<u32>,
}
@group(0) @binding(0) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> previous: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> records: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> bodyStates: array<atomic<u32>>;
@group(0) @binding(5) var<uniform> params: Params;

@compute @workgroup_size(64)
fn beginFrame(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertex = id.x;
  if (vertex >= params.control.y) { return; }
  var record = records[vertex];
  if (record.w < 0.5) { return; }
  let bodyState = params.control.z * 4u;
  if (params.control.x == 1u || params.control.x == 3u) {
    var position = positions[vertex];
    var oldPosition = previous[vertex];
    if (params.control.x == 3u && record.w > 1.5) {
      record = vec4<f32>(position.xyz - params.releaseVelocity.xyz, record.w);
      records[vertex] = record;
    }
    position = vec4<f32>(position.xyz + params.delta.xyz, position.w);
    oldPosition = vec4<f32>(oldPosition.xyz + params.delta.xyz, oldPosition.w);
    if (record.w > 1.5) {
      position = vec4<f32>(params.grabTarget.xyz + record.xyz, position.w);
    }
    positions[vertex] = position;
    previous[vertex] = oldPosition;
    atomicStore(&bodyStates[bodyState], 2u);
  } else if (params.control.x == 2u) {
    var velocity = velocities[vertex];
    velocities[vertex] = vec4<f32>(params.releaseVelocity.xyz, velocity.w);
    atomicStore(&bodyStates[bodyState], 1u);
    atomicStore(&bodyStates[bodyState + 1u], 0u);
  }
}

@compute @workgroup_size(64)
fn projectAnchors(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertex = id.x;
  if (vertex >= params.control.y || params.control.x != 1u) { return; }
  let record = records[vertex];
  if (record.w < 1.5) { return; }
  var position = positions[vertex];
  positions[vertex] = vec4<f32>(params.grabTarget.xyz + record.xyz, position.w);
}
`;function ht(e,t,n){return Ge(e,t,n)}function gt(e,t,n){let r=[e[0]-t[0],e[1]-t[1],e[2]-t[2]],i=Math.hypot(...r);if(i<=1e-8)return[0,0,0];let a=Math.min(.9,n/i);return[r[0]*a,r[1]*a,r[2]*a]}function _t(e,t){let n=Math.hypot(...e),r=n>t?t/n:1;return[e[0]*r,e[1]*r,e[2]*r]}var vt=class e{device;vertexCount;maximumFrameTranslation;maximumReleaseSpeed;recordsBuffer;parametersBuffer;beginFramePipeline;projectPipeline;beginFrameGroup;projectGroup;state=`inactive`;bodyIndex=0;target=[0,0,0];projectedTarget=[0,0,0];grabOrigin=[0,0,0];releaseVelocity=[0,0,0];releaseAfterInitialize=!1;constructor(e,t,n,r,i,a,o,s,c,l){this.device=e,this.vertexCount=t,this.maximumFrameTranslation=n,this.maximumReleaseSpeed=r,this.recordsBuffer=i,this.parametersBuffer=a,this.beginFramePipeline=o,this.projectPipeline=s,this.beginFrameGroup=c,this.projectGroup=l}static async create(t,n,r,i,a,o,s,c){let l=ht(t,new Float32Array(n*4),pt.STORAGE|pt.COPY_DST),u=ht(t,new Uint8Array(64),pt.UNIFORM|pt.COPY_DST),[d,f]=await Promise.all([Y(t,`grab WGSL`,mt,`beginFrame`),Y(t,`grab WGSL`,mt,`projectAnchors`)]),p=[{binding:0,resource:{buffer:a}},{binding:1,resource:{buffer:o}},{binding:2,resource:{buffer:s}},{binding:3,resource:{buffer:l}},{binding:4,resource:{buffer:c}},{binding:5,resource:{buffer:u}}],m=X(t,{cacheKey:d,layout:d.getBindGroupLayout(0),entries:p}),h=X(t,{cacheKey:f,layout:f.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}},{binding:3,resource:{buffer:l}},{binding:5,resource:{buffer:u}}]});return new e(t,n,r,i,l,u,d,f,m,h)}get active(){return this.state===`active`}begin(e,t,n){if(e.length!==this.vertexCount*4)throw Error(`GPU grab records do not match the packed vertex count`);this.device.queue.writeBuffer(this.recordsBuffer,0,e),this.bodyIndex=t,this.target=[...n],this.projectedTarget=[...n],this.grabOrigin=[...n],this.releaseVelocity=[0,0,0],this.releaseAfterInitialize=!1,this.state=`initialize`}updateTarget(e){this.state!==`active`&&this.state!==`initialize`||(this.target=[...e])}end(e){this.state!==`active`&&this.state!==`initialize`||(this.releaseVelocity=_t(e,this.maximumReleaseSpeed),this.state===`initialize`?this.releaseAfterInitialize=!0:this.state=`release`)}uploadParameters(e,t){let n=new ArrayBuffer(64),r=new Float32Array(n),i=new Uint32Array(n);r.set(t,0),r.set(this.target,4),r.set(e===3?this.grabOrigin:this.releaseVelocity,8),i[12]=e,i[13]=this.vertexCount,i[14]=this.bodyIndex,this.device.queue.writeBuffer(this.parametersBuffer,0,n)}encodeFrameStart(e){if(this.state===`inactive`)return;let t=this.state===`initialize`?3:this.state===`active`?1:2,n=t===3?this.grabOrigin:this.projectedTarget,r=t===1||t===3?gt(this.target,n,this.maximumFrameTranslation):[0,0,0];this.uploadParameters(t,r),(t===1||t===3)&&(this.projectedTarget=[n[0]+r[0],n[1]+r[1],n[2]+r[2]]);let i=e.beginComputePass();i.setPipeline(this.beginFramePipeline),i.setBindGroup(0,this.beginFrameGroup),i.dispatchWorkgroups(Math.ceil(this.vertexCount/64)),i.end(),t===2?this.state=`inactive`:t===3&&(this.state=`active`,this.releaseAfterInitialize&&(this.state=`release`))}encodeProjection(e){if(this.state!==`active`)return;let t=e.beginComputePass();t.setPipeline(this.projectPipeline),t.setBindGroup(0,this.projectGroup),t.dispatchWorkgroups(Math.ceil(this.vertexCount/64)),t.end()}destroy(){J(this.recordsBuffer),J(this.parametersBuffer)}},yt={COPY_SRC:4,COPY_DST:8,MAP_READ:1,STORAGE:128,UNIFORM:64},bt=1,xt=`
struct Params {
  origin: vec4<f32>,
  direction: vec4<f32>,
  triangleCount: u32,
  _padding0: u32,
  _padding1: u32,
  _padding2: u32,
}
@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> triangles: array<vec4<u32>>;
@group(0) @binding(2) var<storage, read_write> result: array<atomic<u32>>;
@group(0) @binding(3) var<uniform> params: Params;

fn intersectionDistance(triangleIndex: u32) -> f32 {
  let triangle = triangles[triangleIndex];
  let a = positions[triangle.x].xyz;
  let edge1 = positions[triangle.y].xyz - a;
  let edge2 = positions[triangle.z].xyz - a;
  let p = cross(params.direction.xyz, edge2);
  let determinant = dot(edge1, p);
  if (abs(determinant) < 1e-8) { return -1.0; }
  let inverseDeterminant = 1.0 / determinant;
  let fromA = params.origin.xyz - a;
  let u = dot(fromA, p) * inverseDeterminant;
  if (u < 0.0 || u > 1.0) { return -1.0; }
  let q = cross(fromA, edge1);
  let v = dot(params.direction.xyz, q) * inverseDeterminant;
  if (v < 0.0 || u + v > 1.0) { return -1.0; }
  let distance = dot(edge2, q) * inverseDeterminant;
  return select(-1.0, distance, distance > 0.0);
}

@compute @workgroup_size(1)
fn clearResult() {
  atomicStore(&result[0], 0x7f800000u);
  atomicStore(&result[1], 0xffffffffu);
}

@compute @workgroup_size(64)
fn findDistance(@builtin(global_invocation_id) id: vec3<u32>) {
  let triangle = id.x;
  if (triangle >= params.triangleCount) { return; }
  let distance = intersectionDistance(triangle);
  if (distance > 0.0) {
    atomicMin(&result[0], bitcast<u32>(distance));
  }
}

@compute @workgroup_size(64)
fn findTriangle(@builtin(global_invocation_id) id: vec3<u32>) {
  let triangle = id.x;
  if (triangle >= params.triangleCount) { return; }
  let distance = intersectionDistance(triangle);
  if (distance > 0.0 && bitcast<u32>(distance) == atomicLoad(&result[0])) {
    atomicMin(&result[1], triangle);
  }
}
`;function St(e,t,n){return Ge(e,t,n)}var Ct=class e{device;triangleCount;parametersBuffer;resultBuffer;readbackBuffer;clearPipeline;distancePipeline;trianglePipeline;clearGroup;distanceGroup;triangleGroup;constructor(e,t,n,r,i,a,o,s,c,l,u){this.device=e,this.triangleCount=t,this.parametersBuffer=n,this.resultBuffer=r,this.readbackBuffer=i,this.clearPipeline=a,this.distancePipeline=o,this.trianglePipeline=s,this.clearGroup=c,this.distanceGroup=l,this.triangleGroup=u}static async create(t,n,r,i){let[a,o,s]=await Promise.all([Y(t,`ray-pick WGSL`,xt,`clearResult`),Y(t,`ray-pick WGSL`,xt,`findDistance`),Y(t,`ray-pick WGSL`,xt,`findTriangle`)]),c=St(t,new Uint8Array(48),yt.UNIFORM|yt.COPY_DST),l=St(t,new Uint32Array(2),yt.STORAGE|yt.COPY_SRC),u=t.createBuffer({size:8,usage:yt.MAP_READ|yt.COPY_DST}),d=[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:r}},{binding:2,resource:{buffer:l}},{binding:3,resource:{buffer:c}}],f=X(t,{cacheKey:a,layout:a.getBindGroupLayout(0),entries:[{binding:2,resource:{buffer:l}}]}),p=X(t,{cacheKey:o,layout:o.getBindGroupLayout(0),entries:d}),m=X(t,{cacheKey:s,layout:s.getBindGroupLayout(0),entries:d});return new e(t,i,c,l,u,a,o,s,f,p,m)}async pick(e,t){let n=new ArrayBuffer(48),r=new Float32Array(n),i=new Uint32Array(n);r.set(e,0),r.set(t,4),i[8]=this.triangleCount,this.device.queue.writeBuffer(this.parametersBuffer,0,n);let a=this.device.createCommandEncoder(),o=a.beginComputePass();o.setPipeline(this.clearPipeline),o.setBindGroup(0,this.clearGroup),o.dispatchWorkgroups(1),o.end(),o=a.beginComputePass(),o.setPipeline(this.distancePipeline),o.setBindGroup(0,this.distanceGroup),o.dispatchWorkgroups(Math.ceil(this.triangleCount/64)),o.end(),o=a.beginComputePass(),o.setPipeline(this.trianglePipeline),o.setBindGroup(0,this.triangleGroup),o.dispatchWorkgroups(Math.ceil(this.triangleCount/64)),o.end(),a.copyBufferToBuffer(this.resultBuffer,0,this.readbackBuffer,0,8),this.device.queue.submit([a.finish()]),await this.readbackBuffer.mapAsync(bt);let s=new Uint32Array(this.readbackBuffer.getMappedRange()).slice();return this.readbackBuffer.unmap(),s[1]===4294967295?null:{triangle:s[1],distance:new Float32Array(s.buffer,0,1)[0]}}destroy(){J(this.parametersBuffer),J(this.resultBuffer),this.readbackBuffer.destroy()}},wt=`
struct Globals {
  dt: f32,
  vertexCount: u32,
  gravity: f32,
  damping: f32,
}
@group(0) @binding(0) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> previous: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4<f32>>;
@group(0) @binding(3) var<uniform> globals: Globals;
@group(0) @binding(4) var<storage, read_write> bodyStates: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read> vertexBodies: array<u32>;

@compute @workgroup_size(64)
fn predict(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertex = id.x;
  if (vertex >= globals.vertexCount) { return; }
  var position = positions[vertex];
  previous[vertex] = position;
  let body = vertexBodies[vertex];
  if (atomicLoad(&bodyStates[body * 4u]) == 0u) {
    let velocity = velocities[vertex];
    velocities[vertex] = vec4<f32>(0.0, 0.0, 0.0, velocity.w);
    return;
  }
  if (position.w <= 0.0) { return; }
  var velocity = velocities[vertex];
  velocity = vec4<f32>(velocity.xyz * exp(-velocity.w * globals.dt), velocity.w);
  velocity.y -= globals.gravity * globals.dt;
  position = vec4<f32>(position.xyz + velocity.xyz * globals.dt, position.w);
  positions[vertex] = position;
  velocities[vertex] = velocity;
}
`,Tt=`
struct Tet {
  indices: vec4<u32>,
  inverseRow0: vec4<f32>,
  inverseRow1: vec4<f32>,
  inverseRow2: vec4<f32>,
  rest: vec4<f32>,
}
struct Material {
  elastic: vec4<f32>,
  branchWeights: vec4<f32>,
  relaxationTimes: vec4<f32>,
  plastic: vec4<f32>,
}
struct Params {
  dt: f32,
  tetBase: u32,
  tetCount: u32,
  colorCount: u32,
}
@group(0) @binding(0) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> tetrahedra: array<Tet>;
@group(0) @binding(2) var<uniform> params: Params;
@group(0) @binding(3) var<storage, read> materials: array<Material>;
@group(0) @binding(4) var<storage, read_write> maxwellStates: array<vec4<f32>>;
@group(0) @binding(5) var<storage, read_write> plasticStates: array<vec4<f32>>;
@group(0) @binding(8) var<storage, read_write> bodyStates: array<atomic<u32>>;

fn restInverse(tet: Tet) -> mat3x3<f32> {
  return mat3x3<f32>(
    vec3<f32>(tet.inverseRow0.x, tet.inverseRow1.x, tet.inverseRow2.x),
    vec3<f32>(tet.inverseRow0.y, tet.inverseRow1.y, tet.inverseRow2.y),
    vec3<f32>(tet.inverseRow0.z, tet.inverseRow1.z, tet.inverseRow2.z),
  );
}

fn deformation(tet: Tet, inverse: mat3x3<f32>) -> mat3x3<f32> {
  let a = positions[tet.indices.x].xyz;
  let ds = mat3x3<f32>(
    positions[tet.indices.y].xyz - a,
    positions[tet.indices.z].xyz - a,
    positions[tet.indices.w].xyz - a,
  );
  return ds * inverse;
}

fn loadMaxwell(tetIndex: u32, branch: u32) -> mat3x3<f32> {
  let base = tetIndex * 9u + branch * 3u;
  let row0 = maxwellStates[base];
  let row1 = maxwellStates[base + 1u];
  let row2 = maxwellStates[base + 2u];
  return mat3x3<f32>(
    vec3<f32>(row0.x, row1.x, row2.x),
    vec3<f32>(row0.y, row1.y, row2.y),
    vec3<f32>(row0.z, row1.z, row2.z),
  );
}

fn storeMaxwell(tetIndex: u32, branch: u32, value: mat3x3<f32>) {
  let base = tetIndex * 9u + branch * 3u;
  maxwellStates[base] = vec4<f32>(value[0].x, value[1].x, value[2].x, 0.0);
  maxwellStates[base + 1u] = vec4<f32>(value[0].y, value[1].y, value[2].y, 0.0);
  maxwellStates[base + 2u] = vec4<f32>(value[0].z, value[1].z, value[2].z, 0.0);
}

fn loadPlastic(tetIndex: u32) -> mat3x3<f32> {
  let base = tetIndex * 3u;
  let row0 = plasticStates[base];
  let row1 = plasticStates[base + 1u];
  let row2 = plasticStates[base + 2u];
  return mat3x3<f32>(
    vec3<f32>(row0.x, row1.x, row2.x),
    vec3<f32>(row0.y, row1.y, row2.y),
    vec3<f32>(row0.z, row1.z, row2.z),
  );
}

fn storePlastic(tetIndex: u32, value: mat3x3<f32>) {
  let base = tetIndex * 3u;
  plasticStates[base] = vec4<f32>(value[0].x, value[1].x, value[2].x, 0.0);
  plasticStates[base + 1u] = vec4<f32>(value[0].y, value[1].y, value[2].y, 0.0);
  plasticStates[base + 2u] = vec4<f32>(value[0].z, value[1].z, value[2].z, 0.0);
}

fn inverseMatrix(value: mat3x3<f32>) -> mat3x3<f32> {
  let cofactor = mat3x3<f32>(
    cross(value[1], value[2]),
    cross(value[2], value[0]),
    cross(value[0], value[1]),
  );
  let determinant = dot(value[0], cofactor[0]);
  if (!(abs(determinant) > 1e-7)) {
    return mat3x3<f32>(
      vec3<f32>(1.0, 0.0, 0.0),
      vec3<f32>(0.0, 1.0, 0.0),
      vec3<f32>(0.0, 0.0, 1.0),
    );
  }
  return transpose(cofactor) * (1.0 / determinant);
}

fn positiveCubeRoot(value: f32) -> f32 {
  var root = pow(value, 1.0 / 3.0);
  root = (2.0 * root + value / (root * root)) / 3.0;
  return root;
}

fn solveConstraint(tet: Tet, value: f32, gradient: mat3x3<f32>, compliance: f32) {
  let g1 = gradient[0];
  let g2 = gradient[1];
  let g3 = gradient[2];
  let g0 = -(g1 + g2 + g3);
  var p0 = positions[tet.indices.x];
  var p1 = positions[tet.indices.y];
  var p2 = positions[tet.indices.z];
  var p3 = positions[tet.indices.w];
  let denominator = (
    p0.w * dot(g0, g0) + p1.w * dot(g1, g1)
    + p2.w * dot(g2, g2) + p3.w * dot(g3, g3)
    + compliance / (params.dt * params.dt)
  );
  if (denominator <= 1e-12) { return; }
  let deltaLambda = -value / denominator;
  p0 = vec4<f32>(p0.xyz + p0.w * g0 * deltaLambda, p0.w);
  p1 = vec4<f32>(p1.xyz + p1.w * g1 * deltaLambda, p1.w);
  p2 = vec4<f32>(p2.xyz + p2.w * g2 * deltaLambda, p2.w);
  p3 = vec4<f32>(p3.xyz + p3.w * g3 * deltaLambda, p3.w);
  positions[tet.indices.x] = p0;
  positions[tet.indices.y] = p1;
  positions[tet.indices.z] = p2;
  positions[tet.indices.w] = p3;
}

fn projectStretchEdge(firstIndex: u32, secondIndex: u32, restLength: f32) {
  var first = positions[firstIndex];
  var second = positions[secondIndex];
  let delta = second.xyz - first.xyz;
  let currentLength = length(delta);
  let maximumLength = restLength * ${Ce};
  if (!(currentLength > maximumLength) || !(currentLength > 1e-8)) { return; }
  let denominator = first.w + second.w;
  if (!(denominator > 1e-12)) { return; }
  let correction = delta * ((currentLength - maximumLength) / (currentLength * denominator));
  first = vec4<f32>(first.xyz + correction * first.w, first.w);
  second = vec4<f32>(second.xyz - correction * second.w, second.w);
  positions[firstIndex] = first;
  positions[secondIndex] = second;
}

fn projectTet(tetIndex: u32) {
  let tet = tetrahedra[tetIndex];
  let body = u32(tet.rest.y);
  if (atomicLoad(&bodyStates[body * 4u]) == 0u) { return; }
  let material = materials[tetIndex];
  let youngModulus = material.elastic.x;
  let poissonRatio = material.elastic.y;
  let equilibriumWeight = material.elastic.z;
  let shear = youngModulus / (2.0 * (1.0 + poissonRatio));
  let localShear = shear * material.plastic.z;
  let lame = youngModulus * poissonRatio
    / ((1.0 + poissonRatio) * (1.0 - 2.0 * poissonRatio));
  let inverse = restInverse(tet) * inverseMatrix(loadPlastic(tetIndex));

  var f = deformation(tet, inverse);
  let norm = max(sqrt(dot(f[0], f[0]) + dot(f[1], f[1]) + dot(f[2], f[2])), 1e-7);
  let deviatoricGradient = (f * (1.0 / norm)) * transpose(inverse);
  solveConstraint(
    tet,
    norm,
    deviatoricGradient,
    1.0 / (localShear * equilibriumWeight * tet.rest.x),
  );

  for (var branch = 0u; branch < 3u; branch += 1u) {
    let weight = material.branchWeights[branch];
    if (!(weight > 1e-7)) { continue; }
    let viscousInverse = inverseMatrix(loadMaxwell(tetIndex, branch));
    let effectiveInverse = inverse * viscousInverse;
    let elasticDeformation = deformation(tet, effectiveInverse);
    let elasticNorm = max(
      sqrt(dot(elasticDeformation[0], elasticDeformation[0])
        + dot(elasticDeformation[1], elasticDeformation[1])
        + dot(elasticDeformation[2], elasticDeformation[2])),
      1e-7,
    );
    let gradient = (elasticDeformation * (1.0 / elasticNorm)) * transpose(effectiveInverse);
    solveConstraint(
      tet,
      elasticNorm,
      gradient,
      1.0 / (localShear * weight * tet.rest.x),
    );
  }

  f = deformation(tet, inverse);
  let cofactor = mat3x3<f32>(cross(f[1], f[2]), cross(f[2], f[0]), cross(f[0], f[1]));
  let volumeGradient = cofactor * transpose(inverse);
  let determinant = dot(f[0], cross(f[1], f[2]));
  solveConstraint(
    tet,
    determinant - (1.0 + localShear / lame),
    volumeGradient,
    1.0 / (lame * tet.rest.x),
  );

  // Keep the material compliant in its normal range, but clamp extreme edge
  // strain before sparse or newly cut tetrahedra become visibly stringy.
  let restEdges = inverseMatrix(restInverse(tet));
  projectStretchEdge(tet.indices.x, tet.indices.y, length(restEdges[0]));
  projectStretchEdge(tet.indices.x, tet.indices.z, length(restEdges[1]));
  projectStretchEdge(tet.indices.x, tet.indices.w, length(restEdges[2]));
  projectStretchEdge(tet.indices.y, tet.indices.z, length(restEdges[1] - restEdges[0]));
  projectStretchEdge(tet.indices.y, tet.indices.w, length(restEdges[2] - restEdges[0]));
  projectStretchEdge(tet.indices.z, tet.indices.w, length(restEdges[2] - restEdges[1]));
}

@compute @workgroup_size(64)
fn projectElasticity(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= params.tetCount) { return; }
  projectTet(params.tetBase + id.x);
}

@group(0) @binding(6) var<storage, read> clusterOffsets: array<u32>;
@group(0) @binding(7) var<storage, read> clusterTetrahedra: array<u32>;

@compute @workgroup_size(64)
fn projectElasticityCluster(
  @builtin(workgroup_id) workgroup: vec3<u32>,
  @builtin(local_invocation_id) local: vec3<u32>,
) {
  let offsetBase = workgroup.x * (params.colorCount + 1u);
  for (var color = 0u; color < params.colorCount; color += 1u) {
    let start = clusterOffsets[offsetBase + color];
    let end = clusterOffsets[offsetBase + color + 1u];
    for (var entry = start + local.x; entry < end; entry += 64u) {
      projectTet(clusterTetrahedra[entry]);
    }
    storageBarrier();
  }
}

@compute @workgroup_size(64)
fn relaxMaxwell(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= params.tetCount) { return; }
  let tetIndex = params.tetBase + id.x;
  let tet = tetrahedra[tetIndex];
  let body = u32(tet.rest.y);
  if (atomicLoad(&bodyStates[body * 4u]) == 0u) { return; }
  let material = materials[tetIndex];
  let f = deformation(tet, restInverse(tet));
  let relaxationDeterminant = dot(f[0], cross(f[1], f[2]));
  if (!(relaxationDeterminant > 1e-6)) { return; }
  let volumeScale = positiveCubeRoot(relaxationDeterminant);
  let relaxationTarget = f * (1.0 / volumeScale);
  let targetNorm = sqrt(
    dot(relaxationTarget[0], relaxationTarget[0])
      + dot(relaxationTarget[1], relaxationTarget[1])
      + dot(relaxationTarget[2], relaxationTarget[2]),
  );
  if (!(targetNorm < 4.0)) { return; }
  for (var branch = 0u; branch < 3u; branch += 1u) {
    let weight = material.branchWeights[branch];
    if (!(weight > 1e-7)) { continue; }
    let relaxationTime = max(material.relaxationTimes[branch], 1e-4);
    let blend = 1.0 - exp(-params.dt / relaxationTime);
    let previous = loadMaxwell(tetIndex, branch);
    let candidate = previous * (1.0 - blend) + relaxationTarget * blend;
    let candidateDeterminant = dot(candidate[0], cross(candidate[1], candidate[2]));
    if (!(candidateDeterminant > 0.05)) { continue; }
    let correction = positiveCubeRoot(candidateDeterminant);
    let next = candidate * (1.0 / correction);
    let change = max(
      max(length(next[0] - previous[0]), length(next[1] - previous[1])),
      length(next[2] - previous[2]),
    );
    atomicMax(&bodyStates[body * 4u + 3u], bitcast<u32>(change));
    storeMaxwell(tetIndex, branch, next);
  }

  let currentPlastic = loadPlastic(tetIndex);
  let elasticTrial = f * inverseMatrix(currentPlastic);
  let symmetric = (elasticTrial + transpose(elasticTrial)) * 0.5;
  let hydrostatic = (elasticTrial[0].x + elasticTrial[1].y + elasticTrial[2].z) / 3.0;
  let deviatoric = symmetric - mat3x3<f32>(
    vec3<f32>(hydrostatic, 0.0, 0.0),
    vec3<f32>(0.0, hydrostatic, 0.0),
    vec3<f32>(0.0, 0.0, hydrostatic),
  );
  let squaredNorm = dot(deviatoric[0], deviatoric[0])
    + dot(deviatoric[1], deviatoric[1]) + dot(deviatoric[2], deviatoric[2]);
  let shear = material.elastic.x / (2.0 * (1.0 + material.elastic.y)) * material.plastic.z;
  let equivalentStress = 2.0 * shear * sqrt(1.5 * squaredNorm);
  let yieldStress = material.plastic.x;
  if (!(equivalentStress > yieldStress)) { return; }
  let overstressRate = (equivalentStress - yieldStress) / max(material.plastic.y, 1.0);
  let radialFraction = 1.0 - yieldStress / equivalentStress;
  let plasticBlend = (1.0 - exp(-overstressRate * params.dt)) * radialFraction;
  atomicMax(&bodyStates[body * 4u + 3u], bitcast<u32>(plasticBlend));
  let plasticCandidate = currentPlastic * (1.0 - plasticBlend) + relaxationTarget * plasticBlend;
  let plasticDeterminant = dot(plasticCandidate[0], cross(plasticCandidate[1], plasticCandidate[2]));
  if (!(plasticDeterminant > 0.05)) { return; }
  storePlastic(tetIndex, plasticCandidate * (1.0 / positiveCubeRoot(plasticDeterminant)));
}
`,Et=`
struct Globals {
  dt: f32,
  vertexCount: u32,
  gravity: f32,
  damping: f32,
}
@group(0) @binding(0) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> previous: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> surfaceFlags: array<u32>;
@group(0) @binding(3) var<uniform> globals: Globals;
@group(0) @binding(4) var<storage, read_write> bodyStates: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read> vertexBodies: array<u32>;

fn plateHeight(x: f32, z: f32) -> f32 {
  let radius = length(vec2<f32>(x, z));
  let centerRise = 0.006 * radius * radius;
  let rim = max(0.0, radius - 2.15);
  return -0.33 + centerRise + rim * rim * 0.11;
}

@compute @workgroup_size(64)
fn projectPlate(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertex = id.x;
  if (vertex >= globals.vertexCount) { return; }
  if (atomicLoad(&bodyStates[vertexBodies[vertex] * 4u]) == 0u) { return; }
  if (surfaceFlags[vertex] == 0u) { return; }
  var position = positions[vertex];
  if (position.w <= 0.0) { return; }
  if (length(position.xz) > ${xe}) { return; }
  let minimumY = plateHeight(position.x, position.z) + 0.025;
  if (position.y >= minimumY) { return; }
  let previousPosition = previous[vertex];
  let previousMinimumY = plateHeight(previousPosition.x, previousPosition.z) + 0.025;
  if (previousPosition.y < previousMinimumY - 0.05) { return; }
  position = vec4<f32>(
    previousPosition.x + (position.x - previousPosition.x) * 0.88,
    minimumY,
    previousPosition.z + (position.z - previousPosition.z) * 0.88,
    position.w,
  );
  positions[vertex] = position;
}
`,Dt=`
struct CutPair {
  indices: vec4<u32>,
  normalAndSeparation: vec4<f32>,
}
struct Params {
  pairCount: u32,
  padding0: u32,
  padding1: u32,
  padding2: u32,
}
@group(0) @binding(0) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> pairs: array<CutPair>;
@group(0) @binding(2) var<storage, read_write> state: array<u32>;
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(1)
fn projectCutSurface(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x != 0u) { return; }
  state[0] += 1u;
  // Pairs share vertices along the triangulated cut, so process them
  // sequentially to avoid write races while the new faces are still coplanar.
  for (var pairIndex = 0u; pairIndex < params.pairCount; pairIndex += 1u) {
    let pair = pairs[pairIndex];
    if (state[0] > pair.indices.z) { continue; }
    var negative = positions[pair.indices.x];
    var positive = positions[pair.indices.y];
    let denominator = negative.w + positive.w;
    if (!(denominator > 1e-12)) { continue; }
    let normal = pair.normalAndSeparation.xyz;
    let targetSeparation = pair.normalAndSeparation.w;
    let separation = dot(positive.xyz - negative.xyz, normal);
    let penetration = targetSeparation - separation;
    if (!(penetration > 0.0)) { continue; }
    let lambda = penetration / denominator;
    negative = vec4<f32>(negative.xyz - normal * (negative.w * lambda), negative.w);
    positive = vec4<f32>(positive.xyz + normal * (positive.w * lambda), positive.w);
    positions[pair.indices.x] = negative;
    positions[pair.indices.y] = positive;
  }
}
`,Ot=`
struct Globals {
  dt: f32,
  vertexCount: u32,
  gravity: f32,
  damping: f32,
}
@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> previous: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4<f32>>;
@group(0) @binding(3) var<uniform> globals: Globals;
@group(0) @binding(4) var<storage, read_write> bodyStates: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read> vertexBodies: array<u32>;

@compute @workgroup_size(64)
fn updateVelocity(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertex = id.x;
  if (vertex >= globals.vertexCount) { return; }
  var velocity = velocities[vertex];
  let body = vertexBodies[vertex];
  if (atomicLoad(&bodyStates[body * 4u]) == 0u) {
    velocities[vertex] = vec4<f32>(0.0, 0.0, 0.0, velocity.w);
    return;
  }
  velocity = vec4<f32>((positions[vertex].xyz - previous[vertex].xyz) / globals.dt, velocity.w);
  velocities[vertex] = velocity;
  atomicMax(&bodyStates[body * 4u + 2u], bitcast<u32>(length(velocity.xyz)));
}
`,kt=`
struct SleepParams {
  bodyCount: u32,
  contactWakeOffset: u32,
  hasContacts: u32,
  quietFrameLimit: u32,
  speedThreshold: f32,
  materialThreshold: f32,
  _padding0: u32,
  _padding1: u32,
}
@group(0) @binding(0) var<storage, read_write> bodyStates: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> contactState: array<atomic<u32>>;
@group(0) @binding(2) var<uniform> params: SleepParams;

@compute @workgroup_size(64)
fn beginSleepFrame(@builtin(global_invocation_id) id: vec3<u32>) {
  let body = id.x;
  if (body >= params.bodyCount) { return; }
  atomicStore(&bodyStates[body * 4u + 2u], 0u);
  atomicStore(&bodyStates[body * 4u + 3u], 0u);
  if (params.hasContacts != 0u) {
    let awake = atomicLoad(&bodyStates[body * 4u]);
    atomicStore(&contactState[params.contactWakeOffset + body], select(0u, 1u, awake != 0u));
  }
}

@compute @workgroup_size(64)
fn finishSleepFrame(@builtin(global_invocation_id) id: vec3<u32>) {
  let body = id.x;
  if (body >= params.bodyCount) { return; }
  let stateIndex = body * 4u;
  let awake = atomicLoad(&bodyStates[stateIndex]);
  if (awake == 2u) {
    atomicStore(&bodyStates[stateIndex + 1u], 0u);
    return;
  }
  let contactWake = (
    params.hasContacts != 0u
    && atomicLoad(&contactState[params.contactWakeOffset + body]) == 2u
  );
  let speed = bitcast<f32>(atomicLoad(&bodyStates[stateIndex + 2u]));
  let materialChange = bitcast<f32>(atomicLoad(&bodyStates[stateIndex + 3u]));
  if (contactWake || speed > params.speedThreshold || materialChange > params.materialThreshold) {
    atomicStore(&bodyStates[stateIndex], 1u);
    atomicStore(&bodyStates[stateIndex + 1u], 0u);
    return;
  }
  let quietFrames = atomicAdd(&bodyStates[stateIndex + 1u], 1u) + 1u;
  if (quietFrames >= params.quietFrameLimit) {
    atomicStore(&bodyStates[stateIndex], 0u);
  }
}
`,At=`
struct Params {
  vertexCount: u32,
  _padding0: u32,
  _padding1: u32,
  _padding2: u32,
}
@group(0) @binding(0) var<storage, read> physicsPositions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> physicsIndices: array<vec4<u32>>;
@group(0) @binding(2) var<storage, read> barycentricWeights: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> renderPositions: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read> triangles: array<vec4<u32>>;
@group(0) @binding(5) var<storage, read> incidentOffsets: array<u32>;
@group(0) @binding(6) var<storage, read> incidentTriangles: array<u32>;
@group(0) @binding(7) var<storage, read_write> normals: array<vec4<f32>>;
@group(0) @binding(8) var<uniform> params: Params;

@compute @workgroup_size(64)
fn updateRenderPosition(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertex = id.x;
  if (vertex >= params.vertexCount) { return; }
  let indices = physicsIndices[vertex];
  let weights = barycentricWeights[vertex];
  let position = (
    physicsPositions[indices.x].xyz * weights.x
    + physicsPositions[indices.y].xyz * weights.y
    + physicsPositions[indices.z].xyz * weights.z
    + physicsPositions[indices.w].xyz * weights.w
  );
  renderPositions[vertex] = vec4<f32>(position, 1.0);
}

@compute @workgroup_size(64)
fn updateSurfaceNormal(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertex = id.x;
  if (vertex >= params.vertexCount) { return; }
  var summed = vec3<f32>(0.0);
  let start = incidentOffsets[vertex];
  let end = incidentOffsets[vertex + 1u];
  for (var entry = start; entry < end; entry += 1u) {
    let triangle = triangles[incidentTriangles[entry]];
    let a = renderPositions[triangle.x].xyz;
    let b = renderPositions[triangle.y].xyz;
    let c = renderPositions[triangle.z].xyz;
    summed += cross(b - a, c - a);
  }
  let magnitude = length(summed);
  let normal = select(vec3<f32>(0.0, 1.0, 0.0), summed / magnitude, magnitude > 1e-8);
  normals[vertex] = vec4<f32>(normal, 0.0);
}
`,Q={COPY_SRC:4,COPY_DST:8,MAP_READ:1,QUERY_RESOLVE:512,STORAGE:128,UNIFORM:64},jt=[`predict`,`elasticity`,`maxwell`,`contact`,`plate`,`velocity`];function $(e,t,n){return Ge(e,t,n)}var Mt=class e{device;data;buffers;positionsBuffer;previousBuffer;velocitiesBuffer;bodyStatesBuffer;maxwellStatesBuffer;plasticStatesBuffer;renderPositionsBuffer;normalsBuffer;stateReadbackBuffers;nextStateReadback=0;predictPipeline;clusteredElasticityPipeline;maxwellRelaxationPipeline;platePipeline;velocityPipeline;renderPositionPipeline;normalPipeline;beginSleepPipeline;finishSleepPipeline;cutSurfacePipeline;predictGroup;clusteredElasticityGroup;maxwellRelaxationGroup;plateGroup;velocityGroup;renderPositionGroup;normalGroup;beginSleepGroup;finishSleepGroup;cutSurfaceGroup;plateEnabled;contacts;grab;rayPicker;bodyRelease;get positionStorageBuffer(){return this.renderPositionsBuffer}get normalStorageBuffer(){return this.normalsBuffer}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,ee,N,P,F){this.device=e,this.data=t,this.buffers=n,this.positionsBuffer=r,this.previousBuffer=i,this.velocitiesBuffer=a,this.bodyStatesBuffer=o,this.maxwellStatesBuffer=s,this.plasticStatesBuffer=c,this.renderPositionsBuffer=l,this.normalsBuffer=u,this.stateReadbackBuffers=d,this.predictPipeline=f,this.clusteredElasticityPipeline=p,this.maxwellRelaxationPipeline=m,this.platePipeline=h,this.velocityPipeline=g,this.renderPositionPipeline=_,this.normalPipeline=v,this.beginSleepPipeline=y,this.finishSleepPipeline=b,this.cutSurfacePipeline=x,this.predictGroup=S,this.clusteredElasticityGroup=C,this.maxwellRelaxationGroup=w,this.plateGroup=T,this.velocityGroup=E,this.renderPositionGroup=D,this.normalGroup=O,this.beginSleepGroup=k,this.finishSleepGroup=A,this.cutSurfaceGroup=j,this.plateEnabled=M,this.contacts=ee,this.grab=N,this.rayPicker=P,this.bodyRelease=F}static async create(t,n,r={}){let i=r.dt??1/360,a=new Float32Array(n.positions),o=new Float32Array(n.positions),s=new Float32Array(n.velocities);if(r.damping!==void 0)for(let e=0;e<n.vertexCount;e+=1)s[e*4+3]=r.damping;if(r.freezePositions)for(let e=0;e<n.vertexCount;e+=1)o[e*4+3]=0;let c=$(t,o,Q.STORAGE|Q.COPY_DST|Q.COPY_SRC),l=$(t,a,Q.STORAGE|Q.COPY_DST|Q.COPY_SRC),u=$(t,s,Q.STORAGE|Q.COPY_DST|Q.COPY_SRC),d=$(t,n.vertexBodyIndices,Q.STORAGE),f=new Uint32Array(n.bodyCount*4);for(let e=0;e<n.bodyCount;e+=1)f[e*4]=r.sleepEnabled?1:2;let p=$(t,f,Q.STORAGE|Q.COPY_SRC),m=$(t,new Uint32Array(1),Q.STORAGE),h=$(t,n.surfaceFlags,Q.STORAGE),g=$(t,new Uint8Array(n.tetrahedra),Q.STORAGE),_=$(t,n.materials,Q.STORAGE),v=$(t,n.maxwellStates,Q.STORAGE|Q.COPY_DST|Q.COPY_SRC),y=$(t,n.plasticStates,Q.STORAGE|Q.COPY_DST|Q.COPY_SRC),b=$(t,n.renderPositions,Q.STORAGE),x=$(t,n.renderPhysicsIndices,Q.STORAGE),S=$(t,n.renderWeights,Q.STORAGE),C=new Float32Array(n.renderVertexCount*4);for(let e=0;e<n.renderVertexCount;e+=1)C[e*4+1]=1;let w=$(t,C,Q.STORAGE),T=$(t,n.renderTriangles,Q.STORAGE),E=$(t,n.renderIncidentTriangleOffsets,Q.STORAGE),D=$(t,n.renderIncidentTriangles,Q.STORAGE),O=$(t,new Uint32Array([n.renderVertexCount,0,0,0]),Q.UNIFORM),k=n.positions.byteLength*3+n.maxwellStates.byteLength+n.plasticStates.byteLength,A=Array.from({length:3},()=>t.createBuffer({size:k,usage:Q.MAP_READ|Q.COPY_DST})),j=new ArrayBuffer(16);new Float32Array(j)[0]=i,new Uint32Array(j)[1]=n.vertexCount,new Float32Array(j)[2]=r.gravity??9.81,new Float32Array(j)[3]=r.damping??.7;let M=$(t,new Uint8Array(j),Q.UNIFORM),ee=n.coloring.colorOffsets.length-1,N=new ArrayBuffer(16);new Float32Array(N)[0]=i,new Uint32Array(N)[1]=0,new Uint32Array(N)[2]=n.tetrahedronCount,new Uint32Array(N)[3]=ee;let P=$(t,new Uint8Array(N),Q.UNIFORM),F=$(t,n.elasticityClusterOffsets,Q.STORAGE),I=$(t,n.elasticityClusterTetrahedra,Q.STORAGE),L=new ArrayBuffer(16);new Float32Array(L)[0]=r.materialStateDt??i,new Uint32Array(L)[1]=0,new Uint32Array(L)[2]=n.tetrahedronCount;let R=$(t,new Uint8Array(L),Q.UNIFORM),z=null,B=null,V=[],te=Y(t,`cut surface WGSL`,Dt,`projectCutSurface`);if(n.cutSurfacePairCount>0){let e=$(t,new Uint8Array(n.cutSurfacePairs),Q.STORAGE),r=$(t,new Uint32Array(4),Q.STORAGE),i=$(t,new Uint32Array([n.cutSurfacePairCount,0,0,0]),Q.UNIFORM);z=await te,B=X(t,{cacheKey:z,layout:z.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:r}},{binding:3,resource:{buffer:i}}]}),V.push(e,r,i)}let[H,U,W,ne,re,G,ie,ae,oe]=await Promise.all([Y(t,`predict WGSL`,wt,`predict`),Y(t,`elasticity WGSL`,Tt,`projectElasticityCluster`),Y(t,`elasticity WGSL`,Tt,`relaxMaxwell`),Y(t,`plate WGSL`,Et,`projectPlate`),Y(t,`velocity WGSL`,Ot,`updateVelocity`),Y(t,`render surface WGSL`,At,`updateRenderPosition`),Y(t,`render surface WGSL`,At,`updateSurfaceNormal`),Y(t,`body sleep WGSL`,kt,`beginSleepFrame`),Y(t,`body sleep WGSL`,kt,`finishSleepFrame`)]),se=X(t,{cacheKey:H,layout:H.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:l}},{binding:2,resource:{buffer:u}},{binding:3,resource:{buffer:M}},{binding:4,resource:{buffer:p}},{binding:5,resource:{buffer:d}}]}),ce=X(t,{cacheKey:U,layout:U.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:g}},{binding:2,resource:{buffer:P}},{binding:3,resource:{buffer:_}},{binding:4,resource:{buffer:v}},{binding:5,resource:{buffer:y}},{binding:6,resource:{buffer:F}},{binding:7,resource:{buffer:I}},{binding:8,resource:{buffer:p}}]}),le=X(t,{cacheKey:re,layout:re.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:l}},{binding:2,resource:{buffer:u}},{binding:3,resource:{buffer:M}},{binding:4,resource:{buffer:p}},{binding:5,resource:{buffer:d}}]}),K=X(t,{cacheKey:W,layout:W.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:g}},{binding:2,resource:{buffer:R}},{binding:3,resource:{buffer:_}},{binding:4,resource:{buffer:v}},{binding:5,resource:{buffer:y}},{binding:8,resource:{buffer:p}}]}),ue=X(t,{cacheKey:ne,layout:ne.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:l}},{binding:2,resource:{buffer:h}},{binding:3,resource:{buffer:M}},{binding:4,resource:{buffer:p}},{binding:5,resource:{buffer:d}}]}),de=X(t,{cacheKey:G,layout:G.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:x}},{binding:2,resource:{buffer:S}},{binding:3,resource:{buffer:b}},{binding:8,resource:{buffer:O}}]}),fe=X(t,{cacheKey:ie,layout:ie.getBindGroupLayout(0),entries:[{binding:3,resource:{buffer:b}},{binding:4,resource:{buffer:T}},{binding:5,resource:{buffer:E}},{binding:6,resource:{buffer:D}},{binding:7,resource:{buffer:w}},{binding:8,resource:{buffer:O}}]}),pe=r.contactsEnabled??n.bodyCount>1?await ft.create(t,n,c,l,i):null,me=await vt.create(t,n.vertexCount,n.contactThickness,n.contactThickness*.9/i,c,l,u,p),he=await Ct.create(t,b,T,n.renderTriangleCount),ge=await it.create(t,c,d,n.vertexCount,n.bodyCount),_e=new ArrayBuffer(32),ve=new Uint32Array(_e),ye=new Float32Array(_e);ve[0]=n.bodyCount,ve[1]=pe?.wakeOffset??0,ve[2]=+!!pe,ve[3]=45,ye[4]=.035,ye[5]=2e-5;let be=$(t,new Uint8Array(_e),Q.UNIFORM),xe=pe?.stateBuffer??m,q=[{binding:0,resource:{buffer:p}},{binding:1,resource:{buffer:xe}},{binding:2,resource:{buffer:be}}],Se=X(t,{cacheKey:ae,layout:ae.getBindGroupLayout(0),entries:q}),Ce=X(t,{cacheKey:oe,layout:oe.getBindGroupLayout(0),entries:q});return new e(t,n,[c,l,u,d,p,m,h,g,_,v,y,b,x,S,w,T,E,D,O,...A,M,P,F,I,R,be,...V],c,l,u,p,v,y,b,w,A,H,U,W,ne,re,G,ie,ae,oe,z,se,ce,K,ue,le,de,fe,Se,Ce,B,r.plateEnabled??!0,pe,me,he,ge)}passDescriptor(e,t){if(!e)return;let n=e.nextQuery;return e.nextQuery+=2,e.categories.push(t),{timestampWrites:{querySet:e.querySet,beginningOfPassWriteIndex:n,endOfPassWriteIndex:n+1}}}encodeSubstep(e,t,n=null,r=!0){let i=Math.ceil(this.data.vertexCount/64),a=e.beginComputePass(this.passDescriptor(n,`predict`));a.setPipeline(this.predictPipeline),a.setBindGroup(0,this.predictGroup),a.dispatchWorkgroups(i),a.end(),a=e.beginComputePass(this.passDescriptor(n,`elasticity`)),a.setPipeline(this.clusteredElasticityPipeline),a.setBindGroup(0,this.clusteredElasticityGroup),a.dispatchWorkgroups(this.data.bodyCount),a.end(),this.grab.encodeProjection(e),r&&(a=e.beginComputePass(this.passDescriptor(n,`maxwell`)),a.setPipeline(this.maxwellRelaxationPipeline),a.setBindGroup(0,this.maxwellRelaxationGroup),a.dispatchWorkgroups(Math.ceil(this.data.tetrahedronCount/64)),a.end()),this.contacts?.encode(e,t,Array.from({length:ft.PASS_COUNT},()=>this.passDescriptor(n,`contact`))),this.cutSurfacePipeline&&this.cutSurfaceGroup&&(a=e.beginComputePass(this.passDescriptor(n,`contact`)),a.setPipeline(this.cutSurfacePipeline),a.setBindGroup(0,this.cutSurfaceGroup),a.dispatchWorkgroups(1),a.end()),this.plateEnabled&&(a=e.beginComputePass(this.passDescriptor(n,`plate`)),a.setPipeline(this.platePipeline),a.setBindGroup(0,this.plateGroup),a.dispatchWorkgroups(i),a.end()),a=e.beginComputePass(this.passDescriptor(n,`velocity`)),a.setPipeline(this.velocityPipeline),a.setBindGroup(0,this.velocityGroup),a.dispatchWorkgroups(i),a.end()}encodeSurfaceNormals(e){let t=e.beginComputePass();t.setPipeline(this.renderPositionPipeline),t.setBindGroup(0,this.renderPositionGroup),t.dispatchWorkgroups(Math.ceil(this.data.renderVertexCount/64)),t.end(),t=e.beginComputePass(),t.setPipeline(this.normalPipeline),t.setBindGroup(0,this.normalGroup),t.dispatchWorkgroups(Math.ceil(this.data.renderVertexCount/64)),t.end()}encodeBeginSleepFrame(e){let t=e.beginComputePass();t.setPipeline(this.beginSleepPipeline),t.setBindGroup(0,this.beginSleepGroup),t.dispatchWorkgroups(Math.ceil(this.data.bodyCount/64)),t.end()}encodeFinishSleepFrame(e){let t=e.beginComputePass();t.setPipeline(this.finishSleepPipeline),t.setBindGroup(0,this.finishSleepGroup),t.dispatchWorkgroups(Math.ceil(this.data.bodyCount/64)),t.end()}async runMeasured(e,t=!1,n=1){let r=performance.now(),i=r,a=this.device.createCommandEncoder();this.grab.encodeFrameStart(a),this.encodeBeginSleepFrame(a);for(let r=0;r<e;r+=1)this.encodeSubstep(a,t,null,(r+1)%n===0);this.encodeFinishSleepFrame(a);let o=a.finish(),s=performance.now()-i,c=performance.now();return this.device.queue.submit([o]),await this.device.queue.onSubmittedWorkDone(),{encodingMilliseconds:s,gpuMilliseconds:performance.now()-c,totalMilliseconds:performance.now()-r}}async run(e,t=!1){return(await this.runMeasured(e,t)).gpuMilliseconds}runFrame(e){let t=performance.now(),n=this.device.createCommandEncoder();this.grab.encodeFrameStart(n),this.encodeBeginSleepFrame(n);for(let t=0;t<e;t+=1)this.encodeSubstep(n,!1,null,t===e-1);return this.encodeFinishSleepFrame(n),this.encodeSurfaceNormals(n),this.device.queue.submit([n.finish()]),performance.now()-t}beginGrab(e,t,n){this.grab.begin(e,t,n)}updateGrab(e){this.grab.updateTarget(e)}endGrab(e){this.grab.end(e)}pickRay(e,t){return this.rayPicker.pick(e,t)}readFallenBodyFlags(e){return this.bodyRelease.readFlags(e)}async profileGpuPasses(e,t=1){if(!this.device.features.has(`timestamp-query`))return await this.runMeasured(e,!1,t),null;let n=2+(this.contacts?ft.PASS_COUNT:0)+ +!!this.cutSurfacePipeline+ +!!this.plateEnabled+1,r=Math.floor(e/t),i=(e*n+r)*2,a=i*8,o=this.device.createQuerySet({type:`timestamp`,count:i}),s=this.device.createBuffer({size:a,usage:Q.QUERY_RESOLVE|Q.COPY_SRC}),c=this.device.createBuffer({size:a,usage:Q.MAP_READ|Q.COPY_DST});try{let n=this.device.createCommandEncoder(),r={querySet:o,nextQuery:0,categories:[]};for(let i=0;i<e;i+=1)this.encodeSubstep(n,!1,r,(i+1)%t===0);n.resolveQuerySet(o,0,i,s,0),n.copyBufferToBuffer(s,0,c,0,a),this.device.queue.submit([n.finish()]),await c.mapAsync(1);let l=new BigUint64Array(c.getMappedRange()),u={predict:0,elasticity:0,maxwell:0,contact:0,plate:0,velocity:0};for(let e=0;e<r.categories.length;e+=1){let t=e*2,n=l[t+1]-l[t];u[r.categories[e]]+=Number(n)/1e6}for(let t of jt)u[t]/=e;return u}finally{c.unmap(),c.destroy(),s.destroy(),o.destroy()}}encodeStateCopies(e,t){let n=this.data.positions.byteLength,r=n*3,i=r+this.data.maxwellStates.byteLength;e.copyBufferToBuffer(this.positionsBuffer,0,t,0,n),e.copyBufferToBuffer(this.previousBuffer,0,t,n,n),e.copyBufferToBuffer(this.velocitiesBuffer,0,t,n*2,n),e.copyBufferToBuffer(this.maxwellStatesBuffer,0,t,r,this.data.maxwellStates.byteLength),e.copyBufferToBuffer(this.plasticStatesBuffer,0,t,i,this.data.plasticStates.byteLength)}async mapStateReadback(e){await e.mapAsync(1);try{let t=new Float32Array(e.getMappedRange()),n=this.data.positions.length,r=n*3,i=r+this.data.maxwellStates.length;return{positions:t.slice(0,n),previousPositions:t.slice(n,n*2),velocities:t.slice(n*2,n*3),maxwellStates:t.slice(r,i),plasticStates:t.slice(i,i+this.data.plasticStates.length)}}finally{e.unmap()}}async runAndReadState(e){let t=performance.now(),n=this.stateReadbackBuffers[this.nextStateReadback];this.nextStateReadback=(this.nextStateReadback+1)%this.stateReadbackBuffers.length;let r=this.device.createCommandEncoder();this.encodeBeginSleepFrame(r);for(let t=0;t<e;t+=1)this.encodeSubstep(r,!1);return this.encodeFinishSleepFrame(r),this.encodeStateCopies(r,n),this.device.queue.submit([r.finish()]),{state:await this.mapStateReadback(n),milliseconds:performance.now()-t}}async readState(){let e=this.stateReadbackBuffers[this.nextStateReadback];this.nextStateReadback=(this.nextStateReadback+1)%this.stateReadbackBuffers.length;let t=this.device.createCommandEncoder();return this.encodeStateCopies(t,e),this.device.queue.submit([t.finish()]),this.mapStateReadback(e)}async readFloatBuffer(e,t){let n=this.device.createBuffer({size:t,usage:Q.MAP_READ|Q.COPY_DST});try{let r=this.device.createCommandEncoder();return r.copyBufferToBuffer(e,0,n,0,t),this.device.queue.submit([r.finish()]),await n.mapAsync(1),new Float32Array(n.getMappedRange()).slice()}finally{n.unmap(),n.destroy()}}readPositions(){return this.readFloatBuffer(this.positionsBuffer,this.data.positions.byteLength)}async readSleepingBodyCount(){let e=this.data.bodyCount*16,t=this.device.createBuffer({size:e,usage:Q.MAP_READ|Q.COPY_DST});try{let n=this.device.createCommandEncoder();n.copyBufferToBuffer(this.bodyStatesBuffer,0,t,0,e),this.device.queue.submit([n.finish()]),await t.mapAsync(1);let r=new Uint32Array(t.getMappedRange()),i=0;for(let e=0;e<this.data.bodyCount;e+=1)r[e*4]===0&&(i+=1);return i}finally{t.unmap(),t.destroy()}}readMaxwellStates(){return this.readFloatBuffer(this.maxwellStatesBuffer,this.data.maxwellStates.byteLength)}readPlasticStates(){return this.readFloatBuffer(this.plasticStatesBuffer,this.data.plasticStates.byteLength)}readContactMetrics(){return this.contacts?this.contacts.readMetrics():Promise.resolve(null)}async validateState(){let[e,t,n]=await Promise.all([this.readPositions(),this.readMaxwellStates(),this.readPlasticStates()]);if(!e.every(Number.isFinite))throw Error(`WebGPU positions became non-finite`);for(let e=0;e<this.data.tetrahedronCount;e+=1)for(let n=0;n<3;n+=1){if(this.data.materials[e*16+4+n]<=1e-7)continue;let r=e*36+n*12,i=t[r],a=t[r+1],o=t[r+2],s=t[r+4],c=t[r+5],l=t[r+6],u=t[r+8],d=t[r+9],f=t[r+10],p=i*(c*f-l*d)-a*(s*f-l*u)+o*(s*d-c*u);if(!Number.isFinite(p)||Math.abs(p-1)>.002)throw Error(`WebGPU Maxwell state lost isochoric normalization: det=${p}, max=${Math.max(Math.abs(i),Math.abs(a),Math.abs(o),Math.abs(s),Math.abs(c),Math.abs(l),Math.abs(u),Math.abs(d),Math.abs(f))}`)}for(let e=0;e<this.data.tetrahedronCount;e+=1){let t=e*12,r=n[t]*(n[t+5]*n[t+10]-n[t+6]*n[t+9])-n[t+1]*(n[t+4]*n[t+10]-n[t+6]*n[t+8])+n[t+2]*(n[t+4]*n[t+9]-n[t+5]*n[t+8]);if(!Number.isFinite(r)||Math.abs(r-1)>.002)throw Error(`WebGPU plastic state lost isochoric normalization: det=${r}`)}}destroy(){this.contacts?.destroy(),this.grab.destroy(),this.rayPicker.destroy(),this.bodyRelease.destroy();for(let e of this.buffers)J(e)}};export{Ne as a,u as c,a as d,Be as i,p as l,Ve as n,Me as o,Ke as r,we as s,Mt as t,i as u};