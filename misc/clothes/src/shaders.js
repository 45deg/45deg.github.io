const params = /* wgsl */`
struct Params {
  matrix: mat4x4f,
  physics: vec4f,
  grab: vec4f,
  options: vec4f,
  stroke: vec4f,
  color: vec4f,
  eye: vec4f,
  viewport: vec4f,
};
struct Particle { pos: vec4f, prev: vec4f };
struct Edge { a: u32, b: u32, rest: f32, enabled: u32 };
`;
export const compute = params + /* wgsl */`
@group(0) @binding(0) var<storage, read> src: array<Particle>;
@group(0) @binding(1) var<storage, read_write> dst: array<Particle>;
@group(0) @binding(2) var<storage, read_write> edges: array<Edge>;
@group(0) @binding(3) var<storage, read> adj: array<vec2u>;
@group(0) @binding(4) var<uniform> p: Params;

@compute @workgroup_size(64)
fn integrate(@builtin(global_invocation_id) gid: vec3u) {
  let i=gid.x; if(i>=arrayLength(&src)){return;}
  let old=src[i]; var pos=old.pos.xyz;
  if(old.pos.w>0.) {
    let t=p.physics.y;
    let gust=sin(pos.x*1.7+t*1.9)+cos(pos.y*2.1-t*1.3)*0.6;
    let force=vec3f(p.physics.w*0.4*sin(t*.7),-p.physics.z,p.physics.w*(2.4+gust*1.7));
    pos+=(pos-old.prev.xyz)*(1.-p.options.x)+force*p.physics.x*p.physics.x;
    pos.y=max(pos.y,-1.6);
  }
  if(i==u32(p.grab.w)){pos=p.grab.xyz;}
  dst[i]=Particle(vec4f(pos,old.pos.w),old.pos);
}
@compute @workgroup_size(64)
fn relax(@builtin(global_invocation_id) gid: vec3u) {
  let i=gid.x; if(i>=arrayLength(&src)){return;}
  let a=src[i]; var pos=a.pos.xyz;
  let held=i==u32(p.grab.w);
  if(a.pos.w>0. && !held) {
    var correction=vec3f(0.); var count=0.;
    for(var k=0u;k<8u;k++) {
      let link=adj[i*8u+k]; if(link.x==0xffffffffu){continue;}
      let e=edges[link.y]; if(e.enabled==0u){continue;}
      let b=src[link.x]; let d=b.pos.xyz-pos; let len=length(d);
      let weight=select(b.pos.w,0.,link.x==u32(p.grab.w));
      correction+=d*(len-e.rest)/max(len,0.00001)/(1.+weight);
      count+=1.;
    }
    pos+=correction/max(count,1.)*1.4;
    pos.y=max(pos.y,-1.6);
  }
  if(held){pos=p.grab.xyz;}
  dst[i]=Particle(vec4f(pos,a.pos.w),a.prev);
}
fn screen(v:vec3f)->vec2f { let c=p.matrix*vec4f(v,1.); return (c.xy/c.w*vec2f(.5,-.5)+.5)*p.viewport.xy; }
fn distanceSegment(v:vec2f,a:vec2f,b:vec2f)->f32 { let ab=b-a; return length(v-a-ab*clamp(dot(v-a,ab)/max(dot(ab,ab),.0001),0.,1.)); }
fn cross2(a:vec2f,b:vec2f)->f32{return a.x*b.y-a.y*b.x;}
@compute @workgroup_size(64)
fn cut(@builtin(global_invocation_id) gid:vec3u) {
  let i=gid.x;if(i>=arrayLength(&edges) || p.color.w<.5){return;}
  let e=edges[i]; if(e.enabled==0u){return;}
  let a=screen(src[e.a].pos.xyz);let b=screen(src[e.b].pos.xyz);
  let c=p.stroke.xy;let d=p.stroke.zw;
  let intersect=cross2(b-a,c-a)*cross2(b-a,d-a)<0. && cross2(d-c,a-c)*cross2(d-c,b-c)<0.;
  let dist=min(min(distanceSegment(a,c,d),distanceSegment(b,c,d)),min(distanceSegment(c,a,b),distanceSegment(d,a,b)));
  if(intersect || dist<8.) {edges[i].enabled=0u;}
}
`;
export const render = params + /* wgsl */`
struct Triangle { a:u32,b:u32,c:u32,e0:u32,e1:u32,e2:u32,pad0:u32,pad1:u32 };
@group(0) @binding(0) var<storage,read> particles:array<Particle>;
@group(0) @binding(1) var<storage,read> edges:array<Edge>;
@group(0) @binding(2) var<storage,read> triangles:array<Triangle>;
@group(0) @binding(3) var<uniform> p:Params;
struct Out { @builtin(position) position:vec4f, @location(0) world:vec3f, @location(1) uv:vec2f, @location(2) @interpolate(flat) valid:u32, @location(3) bary:vec3f, @location(4) normal:vec3f };
@vertex fn clothVertex(@builtin(vertex_index) vertex:u32)->Out {
  let t=triangles[vertex/3u]; let corner=vertex%3u; let id=array<u32,3>(t.a,t.b,t.c)[corner];
  let pos=particles[id].pos.xyz; let n=u32(p.options.y);
  var o:Out; o.position=p.matrix*vec4f(pos,1.);o.world=pos;
  o.uv=vec2f(f32(id%n),f32(id/n))/f32(n-1u);
  o.valid=edges[t.e0].enabled*edges[t.e1].enabled*edges[t.e2].enabled;
  let x=id%n; let y=id/n;
  let left=particles[id-select(0u,1u,x>0u)].pos.xyz;
  let right=particles[id+select(0u,1u,x+1u<n)].pos.xyz;
  let up=particles[id-select(0u,n,y>0u)].pos.xyz;
  let down=particles[id+select(0u,n,y+1u<n)].pos.xyz;
  let normal=cross(right-left,up-down);
  o.normal=normal/max(length(normal),.00001);
  o.bary=array<vec3f,3>(vec3f(1,0,0),vec3f(0,1,0),vec3f(0,0,1))[corner];
  return o;
}
@fragment fn clothFragment(o:Out,@builtin(front_facing) front:bool)->@location(0) vec4f {
  let n=normalize(o.normal);
  let light=normalize(vec3f(-.5,1.,1.));
  let diffuse=.34+.66*abs(dot(n,light));
  let view=normalize(p.eye.xyz-o.world);
  let sheen=pow(1.-abs(dot(n,view)),3.)*.28;
  let thread=(sin(o.uv.x*1700.)*sin(o.uv.y*1700.))*.035;
  let lines=smoothstep(vec3f(0.),fwidth(o.bary)*1.15,o.bary);
  let edge=min(min(lines.x,lines.y),lines.z);
  var color=p.color.xyz*(diffuse+thread)+vec3f(.30,.48,.46)*sheen;
  let hem=1.-smoothstep(.003,.013,min(min(o.uv.x,1.-o.uv.x),min(o.uv.y,1.-o.uv.y)));
  color=mix(color,color*.68,hem);
  if(p.options.z>.5){color=mix(vec3f(.04,.12,.14),color,edge);}
  if(o.valid==0u){discard;}
  return vec4f(pow(color,vec3f(.78)),1.);
}
struct FloorOut { @builtin(position) position:vec4f,@location(0) world:vec3f };
@vertex fn floorVertex(@builtin(vertex_index) i:u32)->FloorOut {
  let v=array<vec2f,6>(vec2f(-25,-25),vec2f(25,-25),vec2f(-25,25),vec2f(-25,25),vec2f(25,-25),vec2f(25,25))[i];
  var o:FloorOut; o.world=vec3f(v.x,-1.65,v.y);o.position=p.matrix*vec4f(o.world,1.);return o;
}
@fragment fn floorFragment(o:FloorOut)->@location(0) vec4f {
  let grid=abs(fract(o.world.xz-.5)-.5)/max(fwidth(o.world.xz),vec2f(.001));
  let line=1.-min(min(grid.x,grid.y),1.);
  let fade=exp(-length(o.world.xz)*.14);
  let shadow=exp(-pow(o.world.x/2.3,2.)-pow(o.world.z/1.6,2.))*.24;
  return vec4f(vec3f(.054,.078,.085)*(1.-shadow)+vec3f(.058,.082,.085)*line*fade,1.);
}
@vertex fn supportVertex(@builtin(vertex_index) id:u32)->@builtin(position) vec4f {
  let points=array<vec3f,10>(vec3f(-2,3.1,0),vec3f(2,3.1,0),vec3f(-2,3.1,0),vec3f(-2,3.45,0),vec3f(2,3.1,0),vec3f(2,3.45,0),vec3f(-2.2,3.45,0),vec3f(-1.8,3.45,0),vec3f(1.8,3.45,0),vec3f(2.2,3.45,0));
  return p.matrix*vec4f(points[id],1.);
}
@fragment fn supportFragment()->@location(0) vec4f {return vec4f(.39,.50,.51,1.);}
`;
