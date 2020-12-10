'use strict';
// WARNING: when run in vscode debugger, output to process.stdout 
//   is NOT shown DEBUG CONSOLE window.  See 'outputCapture` 
//   at https://code.visualstudio.com/docs/nodejs/nodejs-debugging 
const fs=require('fs');
const preproc=require('./mini-preproc.js');
async function test(){
  for (const RELEASE of [true,false]){
    for (const strip of [true,false]){
      process.stdout.write(`                       \n`);
      process.stdout.write(`-----------------------\n`);
      process.stdout.write(`RELEASE=${RELEASE},strip=${strip}\n`);
      process.stdout.write(`-----------------------\n`);
      let sIn=fs.createReadStream('./demo-test.txt');
      await new Promise((resolve)=>{
        sIn.pipe(
          preproc.createPreprocStream(
            {RELEASE:RELEASE},{strip:strip})
            .on("end",resolve)
        ).pipe(process.stdout);
      });
    }
  }
}
test();
