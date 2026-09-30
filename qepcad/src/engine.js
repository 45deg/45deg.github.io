export function commands(analysis) {
  const count=Math.max(1,analysis.order.length);
  return analysis.header+'proj-operator ('+Array(Math.max(0,count-1)).fill('c').join(',')+')\nfull-cad\ngo\ngo\nd-proj-factors\ngo\nd-true-cells\nd-false-cells\nsolution-extension T\nfinish\n';
}
export function renameOutput(text,names){
  return text.replace(/\bv\d+\b/g,id=>names[id]||id)
    .replace(/\/\\/g,'∧').replace(/\\\//g,'∨').replace(/\/=/g,'≠').replace(/>=/g,'≥').replace(/<=/g,'≤');
}
export function parseOutput(log,names){
  if(/FAILURE|Error |Error:|not well.oriented|not well oriented|Abort|could not|failed/i.test(log))
    throw new Error('エンジンが計算を完了できませんでした。詳細は実行ログを確認してください。');
  const answers=[...log.matchAll(/An equivalent quantifier-free formula:\s*\n([\s\S]*?)(?=\n\s*Before |\n\s*={5,}|$)/g)];
  if(!answers.length||!log.includes('The End'))throw new Error('完了した計算結果を確認できませんでした。結果を真・偽とは判定しません。');
  const raw=answers.at(-1)[1].trim(),answer=renameOutput(raw,names).replace(/\s+/g,' ').trim();
  const section=log.split('d-proj-factors')[1]?.split('Before Choice')[0]||'';
  const factors=[...section.matchAll(/^([PA]_\d+,\d+)\s*=([\s\S]*?)(?=\n[ \t]*\n|(?![\s\S]))/gm)].map(m=>{
    const last=[...m[2].matchAll(/^[ \t]*=[ \t]*/gm)].at(-1);
    if(!last)throw new Error('射影因子の出力を読み取れませんでした。実行ログを確認してください。');
    return {id:m[1],origin:m[2].slice(0,last.index).replace(/\s+/g,' ').trim(),polynomial:renameOutput(m[2].slice(last.index+last[0].length).replace(/\s+/g,' ').trim(),names)};
  });
  const cells=[...log.matchAll(/Information about the cell (\([^\n]*\))[^\n]*\n([\s\S]*?)(?=\n-{20,})/g)].map(m=>{
    const body=m[2];
    return {index:m[1],level:Number(body.match(/Level\s*:\s*(\d+)/)?.[1]||0),
      dimension:Number(body.match(/Dimension\s*:\s*(\d+)/)?.[1]||0),
      truth:body.match(/Truth value\s*:\s*(T|F)/)?.[1]==='T'?'TRUE':'FALSE',
      signs:[...body.matchAll(/Level (\d+)\s*:\s*(\([^\n]*\))/g)].map(x=>({level:Number(x[1]),signs:x[2]})),
      coordinates:[...body.matchAll(/Coordinate (\d+)\s*=\s*([^\n]+)/g)].map(x=>({level:Number(x[1]),value:x[2].trim()})),detail:body.trim()};
  }).sort((a,b)=>a.index.localeCompare(b.index,undefined,{numeric:true}));
  return {answer,raw,factors,cells,log};
}
