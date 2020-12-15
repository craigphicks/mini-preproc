'use strict';

const cp=require('child_process');
const fs=require('fs');

var tsconfigTests=`
{
  "extends": "@tsconfig/node10/tsconfig.json",

  "compilerOptions": {
    "noImplicitAny": true,
    "skipLibCheck": false,
    "sourceMap": true,
  },
  "include":["tests/*.ts"],
  "exclude":["src","node_modules","examples"]
}
`;

function spawnSync(cmd,aargs){
  let res=cp.spawnSync(cmd,aargs);
  console.log("spawnSync: "+`${cmd} ${JSON.stringify(aargs)}`);
  if (res.status){ 
    console.log('---STDOUT---');
    console.log(res.stdout.toString());
    console.error('---STDERR---');
    console.error(res.stderr.toString());
    throw new Error(`${cmd} ${JSON.stringify(aargs)}`);
  }
}

async function main(){
  spawnSync('npm',['run', 'clean-tests']);
  // spawnSync('npm',['run', 'build-ts']);
  fs.writeFileSync('./tsconfig.tests.json.tmp',tsconfigTests);
  spawnSync('tsc',
    ['-p', './tsconfig.tests.json.tmp']);
  spawnSync('node',['tests/test-mini-preproc.js']);
  spawnSync('node',['tests/test-stream.js']);
  spawnSync('node',['tests/test-error.js']);
}
main()
  .then(()=>{console.log('SUCCESS'); process.exitCode=0;})
  .catch((e)=>{console.log('FAILURE: '+e.message); process.exitCode=1;})
;