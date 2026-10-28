import { spawn } from 'node:child_process';
export async function run(executable: string, args: string[], timeout = 180000): Promise<string> {
  return new Promise((resolve,reject) => {
    const child = spawn(executable,args,{shell:false,windowsHide:true,env:{...process.env,HF_HUB_OFFLINE:'1',TRANSFORMERS_OFFLINE:'1',PYTHONUTF8:'1',TOKENIZERS_PARALLELISM:'false'}});
    let stdout = '', stderr = '', timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32' && child.pid) spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}).on('error',()=>child.kill());
      else child.kill('SIGKILL');
    },timeout);
    child.stdout.on('data',d => { stdout = (stdout + d).slice(-200000); });
    child.stderr.on('data',d => { stderr = (stderr + d).slice(-10000); });
    child.on('error',e => { clearTimeout(timer); reject(new Error(`Could not start ${executable}: ${e.message}`)); });
    child.on('close',code => { clearTimeout(timer); if(timedOut) reject(new Error(`Child process timed out after ${timeout/1000}s`)); else if(code !== 0) reject(new Error(`Process failed (${code}): ${stderr.slice(-2500)}`)); else resolve(stdout); });
  });
}