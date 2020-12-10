'use strict';
const preproc=require('./mini-preproc.js');
async function mpp(defines,strip){
  process.stdin.pipe(
    preproc.createPreprocStream(
      defines,{strip:strip}))
    .on('error',(e)=>{ console.log(e.message);})      
    .pipe(process.stdout);
}
var defines=JSON.parse(process.argv[2]);
var strip=!!JSON.parse(process.argv[3]);
mpp(defines,strip);
