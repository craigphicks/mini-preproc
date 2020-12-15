'strict';
export{}// to stop typescript warning about duplicate declarations

import preproc = require('../dist/mini-preproc');
import fs = require('fs');
//const path = require('path');
import assert=require('assert');
import testText=require('./test-text');
//const stream = require('stream');
//const pipe=stream.pipe;

function assertSame(fnact:string,fnexp:string){
  assert.deepStrictEqual(
    fs.readFileSync(fnact,'utf8').split('\n'),
    fs.readFileSync(fnexp,'utf8').split('\n')
  );
}


async function main(){
  fs.mkdirSync('/tmp/test-mini-preproc/',{recursive:true});
  let tmpdir=fs.mkdtempSync('/tmp/test-mini-preproc/');
  let testDataDir='./tests/test-data';
  fs.mkdirSync(testDataDir,{recursive:true});
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
      let resolve:Function,reject:Function;
      let pr = new Promise((res,rej)=>{resolve=res;reject=rej;});
      let resolver=(v:any)=>{
        resolve(v);
      };
      let rejecter=(e:any)=>{
        reject(e);
      };
      sIn.pipe(
        preproc.createPreprocStream(
          {RELEASE:RELEASE},{strip:strip})
          .on('error',rejecter)
      ).pipe(
        sOut
          .on('error',rejecter)
      )
        .on('close',resolver)
        .on('error',rejecter);
      await pr;
      let fnExpect=`${testDataDir}/${fnbase}-expected.txt`;
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