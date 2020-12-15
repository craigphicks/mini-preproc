'use strict'
import mpp=require('mini-preproc'); 
async function mppCli(defines:mpp.Defs,strip:boolean){
  process.stdin.pipe(
    mpp.createPreprocStream(
      defines,{strip:strip}))
    .on('error',(e)=>{
      console.error(e.message);
      process.exitCode=1;
    })
    .pipe(process.stdout);
}
var defines=JSON.parse(process.argv[2]);
var strip=!!JSON.parse(process.argv[3]);
mppCli(defines,strip);
