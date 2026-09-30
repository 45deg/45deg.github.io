// Classic worker: the synchronous native CAD computation cannot block the UI.
importScripts('../vendor/qepcad.js');
self.onmessage=async({data})=>{
  let output=[],length=0,cursor=0,lastPhase='';
  const bytes=new TextEncoder().encode(data.input);
  try{
    const engine=await createQEPCAD({
      noInitialRun:true,
      locateFile:path=>new URL('../vendor/'+path,self.location.href).href,
      stdin:()=>cursor<bytes.length?bytes[cursor++]:null,
      print:line=>{
        length+=line.length+1;
        if(length>1500000)throw new Error('実行ログが上限を超えたため中断しました。');
        output.push(line);
        const phase=line.match(/Before (Normalization|Projection|Choice|Solution)/)?.[1];
        if(phase&&phase!==lastPhase){lastPhase=phase;self.postMessage({type:'phase',phase});}
      },
      printErr:line=>{if(!line.includes('unsupported syscall: __syscall_getrusage'))output.push('[stderr] '+line);},
      onAbort:reason=>{throw new Error('WASM: '+reason);}
    });
    engine.ENV.qe='/qepcad';
    self.postMessage({type:'phase',phase:'Normalization'});
    engine.callMain(['+N4000000']);
    self.postMessage({type:'result',log:output.join('\n')});
  }catch(error){self.postMessage({type:'error',message:error.message||String(error),log:output.join('\n')});}
};

