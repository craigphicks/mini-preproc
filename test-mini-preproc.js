#!/usr/bin/env node
'strict';

const preproc = require('./mini-preproc.js');
const fs = require('fs');
//const path = require('path');
const assert=require('assert');
const testText=require('./test-text.js');
//const stream = require('stream');
//const pipe=stream.pipe;

function assertSame(fnact,fnexp){
  assert.deepStrictEqual(
    fs.readFileSync(fnact,'utf8').split('\n'),
    fs.readFileSync(fnexp,'utf8').split('\n')
  );
}


async function main(){
  fs.mkdirSync('/tmp/test-mini-preproc/',{recursive:true});
  let tmpdir=fs.mkdtempSync('/tmp/test-mini-preproc/');
  fs.mkdirSync('./test-data/',{recursive:true});
  let fnin=tmpdir+'/preprocIn.txt';
  fs.writeFileSync(fnin,testText.getInputText());

  //let fnout = process.argv[3];
  //let fnspec = process.argv[4];
  let numDiff=0;
  let numNoMatch=0;
  let doWriteExpected=process.argv[2]==='write-expected';
  for (const RELEASE of [true,false]){
    for (const strip of [true,false]){
      let fnbase=`preproc-RELEASE-${RELEASE}-strip-${strip}`; 
      let fnActual = `${tmpdir}/${fnbase}.txt`;
      //let fnout = `./tmp/preproc-RELEASE-${RELEASE}-strip-${strip}.out`;
      let sIn=fs.createReadStream(fnin,{emitClose:true});
      let sOut=fs.createWriteStream(fnActual,{emitClose:true});
      let resolve,reject;
      let pr = new Promise((res,rej)=>{resolve=res;reject=rej;});
      let resolver=(v)=>{
        resolve(v);
      };
      let rejecter=(e)=>{
        reject(e);
      };
      // let logger=(name)=>{
      //   return (x)=>{
      //     console.log(name+(x?':'+JSON.stringify(x):''));
      //   };
      // };
      sIn.pipe(
        preproc.createPreprocStream(
          {RELEASE:RELEASE},{strip:strip})
          .on('error',rejecter)
          //.on('close',logger('preproc close'))
      ).pipe(
        sOut
          .on('error',rejecter)
          //.on('close',logger('out close'))
      )
        //.on('close',logger('pipe close'))
        .on('close',resolver)
        .on('error',rejecter);
      await pr;
      let fnExpect=`./test-data/${fnbase}-expected.txt`;
      if (fs.existsSync(fnExpect) && !doWriteExpected){
        try { assertSame(fnActual,fnExpect); }
        catch(e) { 
          numDiff++; 
        }
      } else {
        numNoMatch++;
      }
      if (doWriteExpected)
        fs.copyFileSync(fnActual,fnExpect);
    }
  }
  if (numNoMatch||numDiff)
    throw new Error(
      `some test(s) FAILED, numNoMatch=${numNoMatch}, numDiff=${numDiff}`);
}

main()
  .then(()=>{
    console.log('test success');
  })
  .catch((e)=>{
    console.error(e.message);
    process.exitCode=1;
  });