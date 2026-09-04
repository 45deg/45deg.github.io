import {createCloth,cameraMatrix,project,sub,dot} from './geometry.js';
import {compute,render} from './shaders.js';
const $=id=>document.getElementById(id), canvas=$('canvas');
const state={n:49,pin:'corners',tool:'grab',wind:1.8,gravity:9.8,stiffness:24,damping:.008,color:[.12,.65,.65],wireframe:false,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,yaw:.20,pitch:.08,radius:8.6,time:0,held:-1,target:[0,0,0],cut:false,stroke:[0,0,0,0],pointer:null};
let device,context,format,uniform,mesh,buffers,computeGroups,renderGroups,floorGroup,current=0,depth,depthWidth=0,depthHeight=0,cam,eye,matrix,ready=false,generation=0;
const pipelines={},uniformData=new Float32Array(44);
function fail(error){ready=false;$('error').hidden=false;$('error-detail').textContent=`${error.message || error}。WebGPU対応のブラウザで http://localhost:5173 を開いてください。`;$('gpu-status').textContent='WebGPU 未接続';console.error(error);}
function buffer(data,usage){const b=device.createBuffer({size:data.byteLength,usage:usage|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(b,0,data);return b;}
function rebuild(){
  generation++;state.held=-1;state.cut=false;state.pointer=null;current=0;state.time=0;
  if(buffers) Object.values(buffers).flat().forEach(b=>b.destroy());
  mesh=createCloth(state.n,state.pin);
  buffers={positions:[0,1].map(()=>buffer(mesh.particles,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC)),edges:buffer(mesh.edges,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC),adj:buffer(mesh.adjacency,GPUBufferUsage.STORAGE),tris:buffer(mesh.triangles,GPUBufferUsage.STORAGE)};
  computeGroups=[0,1].map(i=>device.createBindGroup({layout:pipelines.computeLayout,entries:[buffers.positions[i],buffers.positions[1-i],buffers.edges,buffers.adj,uniform].map((b,binding)=>({binding,resource:{buffer:b}}))}));
  renderGroups=[0,1].map(i=>device.createBindGroup({layout:pipelines.cloth.getBindGroupLayout(0),entries:[buffers.positions[i],buffers.edges,buffers.tris,uniform].map((b,binding)=>({binding,resource:{buffer:b}}))}));
  $('particles').textContent=mesh.count.toLocaleString();$('constraints').textContent=mesh.edgeCount.toLocaleString();
}
function camera(){
  const aspect=canvas.clientWidth/canvas.clientHeight;
  const radius=state.radius*Math.max(1,1.05/aspect);
  const target=[0,canvas.clientWidth<640?1.15:.95,0];eye=[Math.sin(state.yaw)*Math.cos(state.pitch)*radius,target[1]+Math.sin(state.pitch)*radius,Math.cos(state.yaw)*Math.cos(state.pitch)*radius];
  cam=cameraMatrix(eye,target,canvas.clientWidth/canvas.clientHeight);matrix=cam.matrix;
}
function uniforms(){
  camera();uniformData.set(matrix);uniformData.set([1/120,state.time,state.gravity,state.wind],16);
  uniformData.set([...state.target,state.held<0?16777215:state.held],20);
  uniformData.set([state.damping,state.n,Number(state.wireframe),0],24);
  uniformData.set(state.stroke,28);uniformData.set([...state.color,Number(state.cut)],32);
  uniformData.set([...eye,0],36);uniformData.set([canvas.clientWidth,canvas.clientHeight,0,0],40);
  device.queue.writeBuffer(uniform,0,uniformData);
}
function resize(){
  const ratio=Math.min(devicePixelRatio,2),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
  if(w===depthWidth&&h===depthHeight)return;
  canvas.width=w;canvas.height=h;depthWidth=w;depthHeight=h;depth?.destroy();
  depth=device.createTexture({size:[w,h],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});
}
let last=0,accumulator=0,fpsTime=0,frames=0;
function frame(now){
  if(!ready)return;
  try {
    resize();const elapsed=last?Math.min((now-last)/1000,.05):1/60;last=now;
    if(!state.paused)accumulator+=elapsed;else accumulator=0;
    const steps=Math.min(6,Math.floor(accumulator*120));accumulator-=steps/120;
    if(!state.paused)state.time+=steps/120;
    uniforms();const encoder=device.createCommandEncoder();
    function dispatch(name,count){const pass=encoder.beginComputePass();pass.setPipeline(pipelines[name]);pass.setBindGroup(0,computeGroups[current]);pass.dispatchWorkgroups(Math.ceil(count/64));pass.end();}
    if(state.cut){dispatch('cut',mesh.edgeCount);state.cut=false;}
    for(let step=0;step<steps;step++) {dispatch('integrate',mesh.count);current=1-current;for(let j=0;j<state.stiffness;j++){dispatch('relax',mesh.count);current=1-current;}}
    const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:.052,g:.076,b:.085,a:1},loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});
    pass.setPipeline(pipelines.floor);pass.setBindGroup(0,floorGroup);pass.draw(6);
    if(state.pin!=='none'){pass.setPipeline(pipelines.support);pass.setBindGroup(0,pipelines.supportGroup);pass.draw(10);}
    pass.setPipeline(pipelines.cloth);pass.setBindGroup(0,renderGroups[current]);pass.draw(mesh.triangleCount*3);pass.end();device.queue.submit([encoder.finish()]);
    frames++;if(now-fpsTime>600){$('fps').textContent=Math.round(frames*1000/(now-fpsTime));frames=0;fpsTime=now;}
    requestAnimationFrame(frame);
  }catch(error){fail(error);}
}
async function init(){
  if(!navigator.gpu)throw new Error('このブラウザではWebGPUが利用できません');
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
  if(!adapter)throw new Error('利用できるGPUアダプターがありません');
  device=await adapter.requestDevice();device.lost.then(info=>fail(new Error(`GPU接続が失われました: ${info.message}`)));
  device.addEventListener('uncapturederror',event=>fail(event.error));
  context=canvas.getContext('webgpu');format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'opaque'});
  uniform=device.createBuffer({size:176,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  const computeModule=device.createShaderModule({label:'Verlet and constraint relaxation',code:compute}),renderModule=device.createShaderModule({label:'Cloth and floor',code:render});
  for(const module of [computeModule,renderModule]){const info=await module.getCompilationInfo();const errors=info.messages.filter(m=>m.type==='error');if(errors.length)throw new Error(errors.map(e=>`WGSL ${e.lineNum}: ${e.message}`).join('\n'));}
  pipelines.computeLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:'read-only-storage'}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:'storage'}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:'storage'}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:'read-only-storage'}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:'uniform'}}]});
  const layout=device.createPipelineLayout({bindGroupLayouts:[pipelines.computeLayout]});
  for(const entryPoint of ['integrate','relax','cut'])pipelines[entryPoint]=await device.createComputePipelineAsync({layout,compute:{module:computeModule,entryPoint}});
  for(const [name,vertex,fragment,topology] of [['cloth','clothVertex','clothFragment','triangle-list'],['floor','floorVertex','floorFragment','triangle-list'],['support','supportVertex','supportFragment','line-list']]) {
    pipelines[name]=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:renderModule,entryPoint:vertex},fragment:{module:renderModule,entryPoint:fragment,targets:[{format}]},primitive:{topology,cullMode:'none'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less-equal'}});
  }
  floorGroup=device.createBindGroup({layout:pipelines.floor.getBindGroupLayout(0),entries:[{binding:3,resource:{buffer:uniform}}]});
  pipelines.supportGroup=device.createBindGroup({layout:pipelines.support.getBindGroupLayout(0),entries:[{binding:3,resource:{buffer:uniform}}]});
  rebuild();ready=true;$('gpu-status').innerHTML='<i></i> WebGPU 稼働中';requestAnimationFrame(frame);
}
function setTool(tool){state.tool=tool;state.held=-1;document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===tool)));canvas.style.cursor=tool==='cut'?'crosshair':'grab';$('hint').innerHTML=({grab:'布をドラッグして引っ張る',cut:'布をドラッグして切断する',orbit:'ドラッグで視点を回転する'})[tool]+' <span>·</span> ホイールでズーム';}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
document.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>{state.pin=b.dataset.pin;document.querySelectorAll('[data-pin]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(ready)rebuild();});
document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{state.color=b.dataset.color.split(',').map(Number);document.querySelectorAll('[data-color]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
$('resolution').onchange=e=>{state.n=Number(e.target.value);if(ready)rebuild();};
for(const id of ['wind','gravity','stiffness','damping'])$(id).oninput=e=>{const v=Number(e.target.value);state[id]=id==='damping'?v/100:v;$(id+'-out').textContent=id==='damping'?v.toFixed(1)+'%':id==='stiffness'?v:v.toFixed(1);};
$('wireframe').onchange=e=>state.wireframe=e.target.checked;
function pause(){state.paused=!state.paused;updatePause();}
function updatePause(){$('pause').innerHTML=state.paused?'▶ <span>再生</span>':'Ⅱ <span>一時停止</span>';$('pause').setAttribute('aria-label',state.paused?'シミュレーションを再生':'シミュレーションを一時停止');}
$('pause').onclick=pause;updatePause();$('reset').onclick=()=>{if(ready)rebuild();};
const point=e=>{const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
async function pick(pt,token){
  const version=generation, read=device.createBuffer({size:mesh.particles.byteLength,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
  try{
    const encoder=device.createCommandEncoder();encoder.copyBufferToBuffer(buffers.positions[current],0,read,0,mesh.particles.byteLength);device.queue.submit([encoder.finish()]);await read.mapAsync(GPUMapMode.READ);
    if(state.pointer!==token||generation!==version)return;
    const positions=new Float32Array(read.getMappedRange());let best=32*32,selected=-1,position;
    for(let i=0;i<mesh.count;i++){if(positions[i*8+3]===0)continue;const p=Array.from(positions.subarray(i*8,i*8+3)),s=project(p,matrix);if(s[2]<0||s[2]>1)continue;const d=((s[0]*.5+.5)*canvas.clientWidth-pt[0])**2+((.5-s[1]*.5)*canvas.clientHeight-pt[1])**2;if(d<best){best=d;selected=i;position=p;}}
    if(selected>=0){state.held=selected;state.target=position;state.lastPicked=selected;token.anchor=[...position];token.start=pt;token.right=[...cam.right];token.up=[...cam.up];token.scale=2*dot(sub(eye,position),cam.forward)/(cam.f*canvas.clientHeight);}
  }finally{read.destroy();}
}
canvas.addEventListener('pointerdown',e=>{
  if(!ready||state.pointer)return;e.preventDefault();canvas.focus();canvas.setPointerCapture(e.pointerId);camera();const pt=point(e);const token={id:e.pointerId,mode:e.button===2||e.altKey?'orbit':state.tool,last:pt};state.pointer=token;
  if(token.mode==='grab')pick(pt,token).catch(fail);
  if(token.mode==='cut'){state.stroke=[...pt,...pt];state.cut=true;}
});
canvas.addEventListener('pointermove',e=>{
  const token=state.pointer;if(!token||token.id!==e.pointerId)return;const pt=point(e),dx=pt[0]-token.last[0],dy=pt[1]-token.last[1];
  if(token.mode==='orbit'){state.yaw-=dx*.006;state.pitch=Math.max(-.65,Math.min(1.15,state.pitch+dy*.006));}
  if(token.mode==='cut'){state.stroke=[...(state.cut?state.stroke.slice(0,2):token.last),...pt];state.cut=true;}
  if(token.mode==='grab'&&state.held>=0){state.target=token.anchor.map((v,i)=>v+token.right[i]*(pt[0]-token.start[0])*token.scale-token.up[i]*(pt[1]-token.start[1])*token.scale);state.target[1]=Math.max(-1.6,state.target[1]);}
  token.last=pt;
});
function release(e){if(state.pointer?.id===e.pointerId){state.pointer=null;state.held=-1;}}
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();state.radius=Math.max(4,Math.min(18,state.radius*Math.exp(e.deltaY*.001)));},{passive:false});
window.addEventListener('blur',()=>{state.pointer=null;state.held=-1;});
document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;state.pointer=null;state.held=-1;});
window.addEventListener('keydown',e=>{if(/INPUT|SELECT|BUTTON/.test(e.target.tagName))return;if(['1','2','3'].includes(e.key))setTool(['grab','cut','orbit'][Number(e.key)-1]);if(e.code==='Space'){e.preventDefault();pause();}if(e.key.toLowerCase()==='r'&&ready)rebuild();if(e.target===canvas){if(e.key.startsWith('Arrow'))e.preventDefault();if(e.key==='ArrowLeft')state.yaw-=.1;if(e.key==='ArrowRight')state.yaw+=.1;if(e.key==='ArrowUp')state.pitch=Math.min(1.15,state.pitch+.1);if(e.key==='ArrowDown')state.pitch=Math.max(-.65,state.pitch-.1);if(e.key==='+')state.radius=Math.max(4,state.radius-.5);if(e.key==='-')state.radius=Math.min(18,state.radius+.5);}});
// Opt-in diagnostics for local browser verification; no readback during ordinary frames.
if(new URLSearchParams(location.search).has('debug'))window.clothDebug={state,get ready(){return ready;},async snapshot(){await device.queue.onSubmittedWorkDone();const bs=[buffers.positions[current],buffers.edges],sizes=[mesh.particles.byteLength,mesh.edges.byteLength],reads=sizes.map(size=>device.createBuffer({size,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}));const encoder=device.createCommandEncoder();bs.forEach((b,i)=>encoder.copyBufferToBuffer(b,0,reads[i],0,sizes[i]));device.queue.submit([encoder.finish()]);await Promise.all(reads.map(r=>r.mapAsync(GPUMapMode.READ)));const positions=Array.from(new Float32Array(reads[0].getMappedRange())),edges=Array.from(new Uint32Array(reads[1].getMappedRange()));reads.forEach(r=>r.destroy());return{positions,activeEdges:edges.filter((v,i)=>i%4===3&&v===1).length,count:mesh.count};}};
if(new URLSearchParams(location.search).has('debug')) {
  const button=document.createElement('button');button.textContent='GPU検証';button.id='debug-inspect';button.style.cssText='position:fixed;left:130px;bottom:90px;z-index:10;background:#24363b;color:#ddeee8;border:1px solid #617c7d;padding:8px;border-radius:5px';
  const result=document.createElement('output');result.id='debug-result';result.style.cssText='position:fixed;left:24px;bottom:170px;z-index:10;background:#17252b;max-width:90%;font:11px monospace';
  button.onclick=async()=>{try{const s=await window.clothDebug.snapshot();const ys=s.positions.filter((_,i)=>i%8===1);result.textContent=JSON.stringify({finite:s.positions.every(Number.isFinite),activeEdges:s.activeEdges,particles:s.count,minY:Math.min(...ys).toFixed(3),maxY:Math.max(...ys).toFixed(3),checksum:s.positions.reduce((a,v,i)=>a+v*(i+1),0).toFixed(3),lastPicked:state.lastPicked??null,paused:state.paused});}catch(e){result.textContent=e.message;}};
  document.body.append(button,result);
}
init().catch(fail);
