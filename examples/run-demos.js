'use strict';
const cp=require('child_process');
//const fs=require('fs');
//const {Readable}=require('stream');
//const {createPreprocStream}=require('mini-preproc');
function thisdir(){ return __dirname;}
function spawnSync(cmd,aargs,inputStr){
  console.log("spawnSync: "+`${cmd} ${JSON.stringify(aargs)}`);
  let res=cp.spawnSync(cmd,aargs,{input:inputStr});
  if (res.status){ 
    let msg=`
  ---STDOUT---
  ${res.stdout.toString()}  
  ---STDERR---
  ${res.stderr.toString()}
  ---======---
  cmd: ${cmd} ${JSON.stringify(aargs)}
  returned value: ${res.status}  
  `;
    throw new Error(msg);
  }
  return res;
}

var testTxt=`
...before
//--IF{{RELEASE}}
//--const someModule=require('some-module');
//--const RELEASE_MODE=true;
//--ELSE
const someModule=require('./some-module.js');
const RELEASE_MODE=true;
//--ENDIF
//--STOP
...after
`;
var errorTestTxt=`
...before
//--IF
//--const someModule=require('some-module');
//--const RELEASE_MODE=true;
//--ELSE
const someModule=require('./some-module.js');
const RELEASE_MODE=true;
//--ENDIF
//--STOP
...after
`;


async function oneSet(isTS){
  // console.log('__dirname=='+__dirname);
  // console.log('__filename=='+__filename);
  // console.log('process.cwd()=='+process.cwd());
  // let testTxt=fs.readFileSync(`${thisdir()}/data/demo-test.txt`);
  // let errorTestTxt=fs.readFileSync(`${thisdir()}/data/demo-error-test.txt`);
  let jsts=isTS?'ts':'js';
  spawnSync('node',[
    `${thisdir()}/src-${jsts}/demo-cli.js`,
    `{"RELEASE":true}`,`true`
  ],testTxt);

  spawnSync('node',[
    `${thisdir()}/src-${jsts}/demo-cli.js`,
    `{"RELEASE":false}`,`true`
  ],testTxt);

  spawnSync('node',[
    `${thisdir()}/src-${jsts}/demo-cli.js`,
    `{"RELEASE":true}`,`false`
  ],testTxt);

  spawnSync('node',[
    `${thisdir()}/src-${jsts}/demo-cli.js`,
    `{"RELEASE":false}`,`false`
  ],testTxt);

  try {
    spawnSync('node',[
      `${thisdir()}/src-${jsts}/demo-cli.js`,
      `{"RELEASE":true}`,`true`
    ],errorTestTxt);
    //console.log(res.stdout.toString());
    throw 0;
  }catch(e){
    if (e==0){
      throw new Error('was expecting error but it didnt happen');
    }
    // expected error
    // console.log("caught error as expected");
  }
}
async function main(){
  await oneSet(false);
  spawnSync('npm',[
    'install', '--save-dev', '@types/node', '@tsconfig/node10'
  ]);
  spawnSync('tsc',[
    '-p',`${thisdir()}/src-ts/tsconfig.demo-cli.json`
  ]);
  await oneSet(true);
}
main()
  .then(()=>{console.log('SUCCESS');process.exitCode=0;})
  .catch((e)=>{console.log('FAILURE: '+e.message);process.exitCode=1;})
;
