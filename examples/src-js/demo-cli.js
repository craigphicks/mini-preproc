'use strict';
//const {createPreprocStream}=require('../../dist/index.js');
const {createPreprocStream}=require('mini-preproc');
async function mpp(defines,strip){
  process.stdin.pipe(
    createPreprocStream(
      defines,{strip:strip}))
    .on('error',(e)=>{
      console.error(e.message);
      process.exitCode=1;
    })
    .pipe(process.stdout);
}
var defines=JSON.parse(process.argv[2]);
var strip=!!JSON.parse(process.argv[3]);
mpp(defines,strip);
