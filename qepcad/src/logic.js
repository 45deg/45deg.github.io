// No eval, Function, or user-controlled CAS commands. All arithmetic is exact.
export class InputError extends Error {
  constructor(message, pos = 0) { super(message); this.pos = pos; }
}
const abs = n => n < 0n ? -n : n;
const gcd = (a,b) => { a=abs(a); b=abs(b); while(b) [a,b]=[b,a%b]; return a; };
function rat(n,d=1n) {
  if (!d) throw new InputError('0では割れません。');
  if (d<0n) { n=-n; d=-d; }
  const g=gcd(n,d); n/=g; d/=g;
  if (abs(n).toString().length>500 || d.toString().length>500) throw new InputError('係数が大きすぎます。数値や指数を小さくしてください。');
  return [n,d];
}
const radd = (a,b) => rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const rmul = (a,b) => rat(a[0]*b[0],a[1]*b[1]);
const constant = (n,d=1n) => new Map(n ? [['',rat(n,d)]] : []);
const mono = key => Object.assign(Object.create(null),key ? Object.fromEntries(key.split(',').map(t=>{const [v,e]=t.split(':'); return [v,+e];})) : {});
const keyOf = m => Object.entries(m).filter(([,e])=>e).sort(([a],[b])=>a.localeCompare(b)).map(([v,e])=>`${v}:${e}`).join(',');
function guard(p) {
  if (p.size>250) throw new InputError('展開後の多項式が250項を超えます。');
  for(const k of p.keys()) if(Object.values(mono(k)).reduce((a,b)=>a+b,0)>32) throw new InputError('デモで扱える多項式の総次数は32までです。');
  return p;
}
function add(a,b) {
  const out=new Map(a);
  for(const [k,v] of b) { const r=radd(out.get(k)||[0n,1n],v); if(r[0]) out.set(k,r); else out.delete(k); }
  return guard(out);
}
const scale = (p,r) => new Map([...p].map(([k,v])=>[k,rmul(v,r)]).filter(([,v])=>v[0]));
function mul(a,b) {
  const out=new Map();
  for(const [ka,va] of a) for(const [kb,vb] of b) {
    const m=mono(ka);
    for(const [v,e] of Object.entries(mono(kb))) m[v]=(m[v]||0)+e;
    const k=keyOf(m), c=radd(out.get(k)||[0n,1n],rmul(va,vb));
    if(c[0]) out.set(k,c); else out.delete(k);
    guard(out);
  }
  return out;
}
function power(p,n) {
  let out=constant(1n);
  while(n) { if(n%2) out=mul(out,p); n=Math.floor(n/2); if(n) p=mul(p,p); }
  return out;
}
const pvars = p => new Set([...p.keys()].flatMap(k=>Object.keys(mono(k))));
function renamePoly(p,env) {
  const out=new Map();
  for(const [k,c] of p) {
    const m=Object.create(null);
    for(const [v,e] of Object.entries(mono(k))) { const w=env.get(v)||v; m[w]=(m[w]||0)+e; }
    const key=keyOf(m); out.set(key,radd(out.get(key)||[0n,1n],c));
  }
  return out;
}
export function polynomial(p, names={}, clear=true) {
  if(!p.size) return '0';
  let den=1n;
  if(clear) for(const [,c] of p) den=den/gcd(den,c[1])*c[1];
  return [...p].sort(([a],[b])=>Object.values(mono(b)).reduce((x,y)=>x+y,0)-Object.values(mono(a)).reduce((x,y)=>x+y,0)||a.localeCompare(b))
    .map(([k,c],i)=>{
      const n=clear ? c[0]*(den/c[1]) : c[0], d=clear ? 1n:c[1];
      const m=Object.entries(mono(k)).map(([v,e])=>(Object.hasOwn(names,v)?names[v]:v)+(e===1?'':`^${e}`)).join(' ');
      const a=abs(n), coefficient=(a===1n&&d===1n&&m)?'':`${a}${d===1n?'':`/${d}`}`;
      return (n<0n?(i?' - ':'-'):(i?' + ':''))+coefficient+(coefficient&&m?' ':'')+m;
    }).join('');
}
const aliases={'∀':'forall','∃':'exists','¬':'not','!':'not','∧':'and','&':'and','∨':'or','|':'or','≤':'<=','≥':'>=','≠':'!=','→':'->','↔':'<->','−':'-','==':'=','[':'(',']':')'};
const reserved=new Set(['forall','exists','not','and','or','true','false','EOF']);
const identifier=t=>/^[a-zA-Z][a-zA-Z0-9_]*$/.test(t)&&!reserved.has(t);
const node=(kind,...args)=>({kind,args});
export class Parser {
  constructor(text) {
    if(text.length>4000) throw new InputError('入力は4,000文字以内にしてください。');
    this.tokens=[]; this.i=0; this.depth=0;
    const token=/\s+|<->|->|<=|>=|!=|==|\d+(?:\.\d+)?|[a-zA-Z][a-zA-Z0-9_]*|[()+*/^:,.<>=!&|\[\]¬∧∨∀∃≤≥≠→↔−-]/y;
    let p=0;
    while(p<text.length) {
      token.lastIndex=p; const m=token.exec(text);
      if(!m) throw new InputError(`「${text[p]}」は使えません。掛け算には * を使います。`,p);
      if(!/^\s+$/.test(m[0])) this.tokens.push({value:Object.hasOwn(aliases,m[0])?aliases[m[0]]:m[0],pos:p});
      p=token.lastIndex;
    }
    if(this.tokens.length>600) throw new InputError('式は600トークン以内にしてください。');
    this.tokens.push({value:'EOF',pos:text.length});
  }
  peek(){return this.tokens[this.i].value;}
  take(){return this.tokens[this.i++].value;}
  accept(t){if(this.peek()===t){this.take();return true;}return false;}
  error(msg){throw new InputError(msg,this.tokens[this.i].pos);}
  need(t){if(!this.accept(t))this.error(`ここには「${t}」が必要です。`);}
  enter(){if(++this.depth>60)this.error('入れ子が深すぎます。括弧や量化子を減らしてください。');}
  parse(){if(this.peek()==='EOF')this.error('論理式を入力してください。');const n=this.formula();if(this.peek()!=='EOF')this.error('式が続いています。積は *、論理式は and / or でつないでください。');return n;}
  formula(){this.enter();const n=this.binary(0);this.depth--;return n;}
  binary(level){
    const ops=['<->','->','or','and'];
    if(level===4)return this.unary();
    let n=this.binary(level+1);
    while(this.peek()===ops[level]){const op=this.take();n=node(op,n,this.binary(op==='->'?level:level+1));}
    return n;
  }
  unary(){
    if(this.accept('not')){this.enter();const n=node('not',this.unary());this.depth--;return n;}
    if(['exists','forall'].includes(this.peek())){
      const q=this.take(),vs=[];
      do{if(!identifier(this.peek()))this.error('量化する変数名が必要です。例：exists x: x^2 = 2');vs.push(this.take());}while(this.accept(','));
      this.need(':');let n=this.formula();for(const v of vs.reverse())n=node(q,v,n);return n;
    }
    if(['true','false'].includes(this.peek()))return node('bool',this.take()==='true');
    const start=this.i, depth=this.depth;
    try{
      let left=this.poly(),n;
      while(['=','!=','<','<=','>','>='].includes(this.peek())){
        const op=this.take(),right=this.poly(),a=node('atom',add(left,scale(right,[-1n,1n])),op);
        n=n?node('and',n,a):a;left=right;
      }
      if(!n)this.error('多項式の後に =、<、>= などの比較を入れてください。');
      return n;
    }catch(error){
      if(!(error instanceof InputError))throw error;
      this.i=start;this.depth=depth;
      if(!this.accept('('))throw error;
      try{const n=this.formula();this.need(')');return n;}catch(logicError){throw error.pos>logicError.pos?error:logicError;}
    }
  }
  poly(){let n=this.product();while(['+','-'].includes(this.peek())){const op=this.take(),r=this.product();n=add(n,op==='+'?r:scale(r,[-1n,1n]));}return n;}
  product(){
    let n=this.signed();while(['*','/'].includes(this.peek())){
      const op=this.take(),r=this.signed();
      if(op==='*')n=mul(n,r);
      else{if(pvars(r).size)this.error('分母は0でない有理数にしてください。変数を含む分母は使えません。');if(!r.size)this.error('0では割れません。');const c=r.get('');n=scale(n,rat(c[1],c[0]));}
    }return n;
  }
  signed(){
    if(['+','-'].includes(this.peek())){this.enter();const op=this.take(),r=this.signed();this.depth--;return op==='+'?r:scale(r,[-1n,1n]);}
    let n=this.base();if(this.accept('^')){if(!/^\d+$/.test(this.peek())||+this.peek()>32)this.error('指数には0〜32の整数を使ってください。');n=power(n,+this.take());}return n;
  }
  base(){
    if(this.accept('(')){this.enter();const n=this.poly();this.need(')');this.depth--;return n;}
    const t=this.peek();
    if(/^\d+(\.\d+)?$/.test(t)){if(t.length>50)this.error('数値は50桁以内にしてください。');this.take();const[a,b='']=t.split('.');return constant(BigInt(a+b),10n**BigInt(b.length));}
    if(identifier(t)){this.take();return new Map([[`${t}:1`,[1n,1n]]]);}
    this.error('数・変数・括弧で囲んだ多項式を入力してください。');
  }
}
export function freeVars(n,bound=new Set()){
  if(n.kind==='atom')return new Set([...pvars(n.args[0])].filter(v=>!bound.has(v)));
  if(n.kind==='bool')return new Set();
  if(['exists','forall'].includes(n.kind))return freeVars(n.args[1],new Set([...bound,n.args[0]]));
  return new Set(n.args.flatMap(c=>[...freeVars(c,bound)]));
}
export function prenex(root){
  let counter=0,budget=0;const names={},free=[...freeVars(root)].sort(),env=new Map();
  const fresh=old=>{const id=`v${++counter}`;names[id]=old;return id;};
  free.forEach(v=>env.set(v,fresh(v)));
  function rename(n,e,internal=false){
    if(n.kind==='atom')return node('atom',renamePoly(n.args[0],e),n.args[1]);
    if(n.kind==='bool')return n;
    if(['exists','forall'].includes(n.kind)){const[v,b]=n.args,id=fresh(internal?names[v]:v);return node(n.kind,id,rename(b,new Map([...e,[v,id]]),internal));}
    return node(n.kind,...n.args.map(c=>rename(c,e,internal)));
  }
  function nnf(n,neg=false){
    if(++budget>1500)throw new InputError('同値記号の展開が大きすぎます。式を分けてください。');
    const[k,a]=[n.kind,n.args];
    if(k==='bool')return node(k,a[0]!==neg);
    if(k==='atom')return node(k,a[0],neg?{'=':'!=','!=':'=','<':'>=','>':'<=','<=':'>','>=':'<'}[a[1]]:a[1]);
    if(k==='not')return nnf(a[0],!neg);
    if(k==='->')return nnf(node('or',node('not',a[0]),a[1]),neg);
    if(k==='<->')return nnf(node('or',node('and',...a),node('and',...a.map(c=>node('not',c)))),neg);
    if(['exists','forall'].includes(k))return node(neg?{exists:'forall',forall:'exists'}[k]:k,a[0],nnf(a[1],neg));
    return node(neg?{and:'or',or:'and'}[k]:k,...a.map(c=>nnf(c,neg)));
  }
  function pull(n){
    if(['exists','forall'].includes(n.kind)){const[p,m]=pull(n.args[1]);return [[{kind:n.kind,id:n.args[0]},...p],m];}
    if(['bool','atom'].includes(n.kind))return [[],n];
    const[p,l]=pull(n.args[0]),[q,r]=pull(n.args[1]);return [[...p,...q],node(n.kind,l,r)];
  }
  const [p,matrix]=pull(rename(nnf(rename(root,env)),new Map(),true));
  const active=freeVars(matrix),prefix=p.filter(q=>active.has(q.id)),f=free.map(v=>env.get(v)).filter(v=>active.has(v));
  if(f.length+prefix.length>12)throw new InputError('デモでは前束化後の変数を12個まで扱えます。');
  const order=[...f,...prefix.map(q=>q.id)], labels={};
  // Preserve original names for free variables; disambiguate shadowed binders.
  const used=new Set(f.map(id=>names[id]));
  for(const id of order){let label=names[id];if(!f.includes(id)){let i=1;while(used.has(label))label=`${names[id]}_${++i}`;}labels[id]=label;used.add(label);}
  return {free:f,prefix,matrix,order,names:labels};
}
export function formula(n,names={},engine=false){
  if(n.kind==='bool')return engine?(n.args[0]?'0 = 0':'0 /= 0'):(n.args[0]?'true':'false');
  if(n.kind==='atom')return polynomial(n.args[0],names)+` ${engine&&n.args[1]==='!='?'/=':n.args[1]} 0`;
  if(['exists','forall'].includes(n.kind))return `(${n.kind==='exists'?'∃':'∀'}${n.args[0]}: ${formula(n.args[1],names,engine)})`;
  if(n.kind==='not')return `¬(${formula(n.args[0],names,engine)})`;
  const op=engine?{and:' /\\ ',or:' \\/ '}[n.kind]:{and:' ∧ ',or:' ∨ ','->':' → ','<->':' ↔ '}[n.kind];
  return `${engine?'[':'('}${formula(n.args[0],names,engine)}${op}${formula(n.args[1],names,engine)}${engine?']':')'}`;
}
export function analyze(text){
  const root=new Parser(text).parse(),p=prenex(root),polys=new Set();
  function visit(n){if(n.kind==='atom')polys.add(polynomial(n.args[0],p.names));else if(n.kind!=='bool')n.args.forEach(visit);}
  visit(p.matrix);
  if(polys.size>64)throw new InputError('多項式は64個以内にしてください。');
  const order=p.order.length?p.order:['v0'];
  const prefix=p.order.length?p.prefix.map(q=>`(${q.kind==='exists'?'E':'A'} ${q.id})`).join(''):'(E v0)';
  const f=prefix+'['+formula(p.matrix,{},true)+'].';
  return {...p,root,matrix:undefined,normalized:formula(root),polynomials:[...polys],
    prenex:p.prefix.map(q=>(q.kind==='exists'?'∃':'∀')+p.names[q.id]+': ').join('')+formula(p.matrix,p.names),
    engineFormula:f,header:`[CAD notebook]\n(${order.join(',')})\n${p.free.length}\n${f}\n`};
}
