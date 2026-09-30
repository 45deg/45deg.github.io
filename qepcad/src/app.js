import {tr,setText,initLanguage} from './i18n.js';
import {analyze,InputError} from './logic.js';
import {commands,parseOutput} from './engine.js';
const $=id=>document.getElementById(id);
const examples={
  sqrt:['exists y: y^2 = x','y² = x を満たす実数 y が存在するための、x の条件を求めます。'],
  alternating:['forall x: exists y: y > x','任意の実数 x より大きい実数 y が存在する。'],
  reverse:['exists y: forall x: y > x','すべての実数 x より大きい実数 y が存在するかを判定します。'],
  quadratic:['exists x: a*x^2 + b*x + c = 0','a = 0 の退化した場合も含め、実数解の存在条件を求めます。'],
  interval:['exists y: (0 < y < 1) and y^2 = x','区間 (0, 1) に解があるための x の条件。'],
  nested:['(exists x: x^2 = a) and (forall y: y^2 + b > 0)','別々の範囲を持つ量化子を前束化し、a・b の条件へ。'],
  three:['forall x: exists y: forall z: y > x and z^2 >= 0','3つの変数と、∀・∃・∀ の交替を扱います。']
};
let current=null,computed=null,result=null,step=0,worker=null,timer=null,deadline=null,lastInput='',started=0,validationTimer;
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=tr(text);if(cls)e.className=cls;return e;}
function math(target,text){
  target.replaceChildren();
  const display=tr(text).replace(/>=/g,'≥').replace(/<=/g,'≤').replace(/!=/g,'≠').replace(/\*/g,'×');
  const re=/\^(\d+)/g;let last=0;
  for(const m of display.matchAll(re)){target.append(document.createTextNode(display.slice(last,m.index)),el('sup',m[1]));last=m.index+m[0].length;}
  target.append(document.createTextNode(display.slice(last)));
  target.setAttribute('aria-label',text);
}
function validate(){
  try{
    current=analyze($('formula').value);
    setText($('validation'),'入力形式を確認済み'+(current.free.length?'。自由変数 '+current.free.map(v=>current.names[v]).join(', '):'。自由変数なし'));
    $('validation').className='validation';$('formula').setAttribute('aria-invalid','false');
    $('run').disabled=!!worker;
    if(!computed){math($('formula-preview'),current.normalized);render();}
  }catch(e){
    current=null;
    const pos=e instanceof InputError?e.pos:0,before=$('formula').value.slice(0,pos),line=before.split('\n').length,col=pos-(before.lastIndexOf('\n')+1)+1;
    setText($('validation'),`${line}行${col}列：${e.message}`);$('validation').className='validation invalid';$('formula').setAttribute('aria-invalid','true');$('run').disabled=true;
    if(!computed){setText($('formula-preview'),'—');render();}
  }
  $('stale').hidden=!computed||$('formula').value===lastInput;
}
function render(){
  const a=computed||current,stage=$('stage');stage.replaceChildren();
  document.querySelectorAll('[data-step]').forEach(b=>{if(+b.dataset.step===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('previous').disabled=step===0;$('next').disabled=step===3;setText($('step-count'),`${step+1} / 4`);
  if(!a){stage.append(el('h3','式を入力して始める'),el('p','入力欄の案内に沿って式を修正してください。'));return;}
  const title=['前束標準形','射影因子','真偽が確定したセル','量化子の評価順序'][step];
  const description=[
    '比較式を整数係数の多項式と 0 の比較に変換します。変数の捕獲を防ぐために束縛変数を改名し、量化子を先頭に移します。',
    'Collinsの射影を用い、係数・判別式・終結式などから、下位の変数空間を分割する多項式を求めます。',
    'CADは射影因子の符号が一定となるように空間を分割します。ここにはQEPCADが出力した、真偽が確定したセルとその標本点・符号を表示します。',
    '∃ は子セルの少なくともひとつが真なら真、∀ はすべてが真なら真。量化子の順序に従って判定を伝播し、自由変数だけの式を構成します。'
  ][step];
  stage.append(el('h3',title),el('p',description));
  if(step===0){
    const box=el('div',undefined,'formula-box math');math(box,a.prenex);stage.append(box);
    const stats=el('div',undefined,'stats');
    for(const[label,value]of [['自由変数',a.free.map(v=>a.names[v]).join(', ')||'なし'],['量化子',a.prefix.length+' 個'],['変数順序',a.order.map(v=>a.names[v]).join(' ≺ ')||'定数式']]){
      const stat=el('div');stat.append(el('span',label),el('strong',value));stats.append(stat);
    }stage.append(stats,el('p','変数順序は自由変数から始まり、量化子の外側から内側へ並びます。射影は逆順です。','caption'));
  }else if(!result){
    stage.append(el('div',worker?'計算が完了すると、この段階の結果が表示されます。':'「計算する」を押すと、QEPCADの出力を表示します。','empty-state'));
  }else if(step===1){
    const groups=new Map();
    for(const f of result.factors){const level=+f.id.match(/_(\d+)/)[1];if(!groups.has(level))groups.set(level,[]);groups.get(level).push(f);}
    for(const [level,factors]of [...groups].sort(([x],[y])=>y-x)){
      const group=el('div',undefined,'projection-group');group.append(el('h4',`レベル ${level}: ${a.order.slice(0,level).map(v=>a.names[v]).join(', ')}`));
      const polys=el('div',undefined,'polys');for(const f of factors){const p=el('div',undefined,'poly math');math(p,f.polynomial);p.title=f.id+' = '+f.origin;polys.append(p);}group.append(polys);stage.append(group);
    }
    if(!groups.size)stage.append(el('div','この式では射影因子が生成されませんでした。定数への簡約など、詳細はエンジン出力で確認できます。','empty-state'));
    stage.append(el('p','各多項式の生成元は、下のエンジン出力で確認できます。','caption'));
  }else if(step===2){
    const list=el('div',undefined,'cell-list');
    for(const c of result.cells.slice(0,36)){
      const card=el('div',undefined,'cell');card.dataset.truth=c.truth;
      card.append(el('strong',`セル ${c.index}`),el('div',c.truth==='TRUE'?'真（TRUE）':'偽（FALSE）','truth'),el('p',`次元 ${c.dimension} / レベル ${c.level}`));
      for(const coord of c.coordinates)card.append(el('p',`${a.names[a.order[coord.level-1]]||'座標 '+coord.level} = ${coord.value}`));
      if(c.signs.length)card.append(el('p',c.signs.map(s=>'L'+s.level+': '+s.signs).join(' / ')));
      list.append(card);
    }stage.append(list);
    if(!result.cells.length)stage.append(el('div','表示対象のセルはありません。定数への簡約など、詳細はエンジン出力で確認できます。','empty-state'));
    stage.append(el('p',`${result.cells.length} 個の確定セル${result.cells.length>36?'（先頭36個を表示）':''}。座標は標本点です。L の符号列は、各レベルの射影因子の順序に対応します。`,'caption'));
    stage.append(el('p','QEPCADは部分CADを用いるため、判定に不要な高次元セルは保持されない場合があります。標本点だけを数値テストして結論を出しているわけではありません。','caption'));
  }else{
    const box=el('div',undefined,'formula-box math');math(box,a.prefix.map(q=>(q.kind==='exists'?'∃':'∀')+a.names[q.id]).reverse().join('  →  ')||'量化子なし');stage.append(box);
    stage.append(el('p',a.prefix.length?'上は内側から消去する順序です。下の結果は元の論理式と同じ自由変数の条件を表します。':'入力には量化子がないため、CADによる等価な式の簡約を表示します。'));
    stage.append(el('p','厳密な有理数・実代数的数の演算を使用しています。浮動小数点での近似的な充足判定ではありません。','caption'));
  }
}
function stop(){
  if(worker)worker.terminate();worker=null;clearInterval(timer);clearTimeout(deadline);
  $('progress').hidden=true;$('cancel').hidden=true;$('run').disabled=!current;
}
function showError(message,log=''){
  stop();$('error').hidden=false;setText($('error'),message);
  if(log){$('audit').hidden=false;setText($('engine-log'),log);}
}
function run(){
  clearTimeout(validationTimer);validate();if(!current||worker)return;
  result=null;computed=current;lastInput=$('formula').value;started=performance.now();
  $('answer').hidden=true;$('audit').hidden=true;$('error').hidden=true;$('stale').hidden=true;
  setText($('result-meta'),'計算中');math($('formula-preview'),computed.normalized);
  $('run').disabled=true;$('cancel').hidden=false;$('progress').hidden=false;
  setText($('progress-label'),'WASMエンジンを読み込んでいます…');
  setText($('engine-input'),commands(computed));
  setText($('variable-map'),Object.entries(computed.names).map(([k,v])=>k+' = '+v).join('   /   '));
  render();
  try{worker=new Worker(new URL('./worker.js',import.meta.url));}catch(e){showError('Web Workerを起動できません。HTTP(S)でページを開いてください。');setText($('result-meta'),'未完了');return;}
  timer=setInterval(()=>setText($('elapsed'),((performance.now()-started)/1000).toFixed(1)+' s',100));
  deadline=setTimeout(()=>{showError('60秒の計算上限に達したため中断しました。式や変数の数を小さくして再実行してください。');setText($('result-meta'),'未完了');},60000);
  worker.onmessage=({data})=>{
    if(data.type==='phase'){setText($('progress-label'),{Normalization:'論理式を正規化しています…',Projection:'射影多項式を計算しています…',Choice:'セルを構成して真偽を判定しています…',Solution:'量化子なしの式を構成しています…'}[data.phase]||'計算しています…');return;}
    if(data.type==='error'){showError(data.message,data.log);setText($('result-meta'),'未完了');return;}
    if(data.type==='result'){
      const elapsed=((performance.now()-started)/1000).toFixed(2);stop();
      $('audit').hidden=false;setText($('engine-log'),data.log);
      try{
        result=parseOutput(data.log,computed.names);
        $('answer').hidden=false;math($('answer-formula'),result.answer);
        setText($('answer-note'),result.answer==='TRUE'?'元の式はすべての自由変数の値で成り立ちます。自由変数がなければ、命題は真です。':result.answer==='FALSE'?'元の式を満たす自由変数の値はありません。自由変数がなければ、命題は偽です。':'この条件を満たす自由変数に対して、元の論理式が成り立ちます。');
        setText($('result-meta'),'完了（'+elapsed+' s）');
        render();
      }catch(e){showError(e.message,data.log);setText($('result-meta'),'未完了');}
    }
  };
  worker.onerror=()=>{showError('WASMエンジンを読み込めませんでした。配信ファイルとブラウザのWebAssembly対応を確認してください。');setText($('result-meta'),'未完了');};
  worker.postMessage({input:commands(computed)});
}
$('formula').addEventListener('input',()=>{clearTimeout(validationTimer);$('stale').hidden=!computed||$('formula').value===lastInput;validationTimer=setTimeout(validate,180);});
$('formula').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();}});
$('run').addEventListener('click',run);
$('cancel').addEventListener('click',()=>{stop();setText($('result-meta'),'中断');$('error').hidden=false;setText($('error'),'計算を中断しました。式を編集して再実行できます。');render();});
document.querySelectorAll('[data-insert]').forEach(b=>b.addEventListener('click',()=>{
  const t=$('formula'),start=t.selectionStart,end=t.selectionEnd,selected=t.value.slice(start,end);
  let value=b.dataset.insert;if(value==='()'&&selected)value='('+selected+')';
  if(value==='not ()'&&selected)value='not ('+selected+')';
  t.focus();t.setSelectionRange(start,end);
  // insertText preserves the browser's undo/redo history; setRangeText does not.
  if(!document.execCommand('insertText',false,value))t.setRangeText(value,start,end,'end');
  const back=selected?0:Number(b.dataset.back||0);
  t.setSelectionRange(start+value.length-back,start+value.length-back);validate();
}));
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=+b.dataset.step;render();}));
$('previous').addEventListener('click',()=>{step=Math.max(0,step-1);render();});
$('next').addEventListener('click',()=>{step=Math.min(3,step+1);render();});
$('example').addEventListener('change',()=>{stop();computed=null;result=null;step=0;$('formula').value=examples[$('example').value][0];setText($('example-note'),examples[$('example').value][1]);$('answer').hidden=true;$('audit').hidden=true;$('error').hidden=true;setText($('result-meta'),'未計算');validate();});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result.answer);setText($('copy'),'コピーしました');setTimeout(()=>setText($('copy'),'コピー'),1500);}catch{setText($('copy'),'数式を選択してコピーしてください');}});
initLanguage(()=>{validate();render();});
setText($('example-note'),examples.sqrt[1]);validate();run();
