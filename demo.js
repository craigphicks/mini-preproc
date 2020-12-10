const fs=require('fs');
const preproc=require('./mini-preproc.js');
async function test(){
  for (const RELEASE of [true,false]){
    for (const strip of [true,false]){
      process.stdout.write(`-----------------------\n`);
      process.stdout.write(`RELEASE=${RELEASE},strip=${strip}\n`);
      process.stdout.write(`-----------------------\n`);
      let sIn=fs.createReadStream('./test.txt',{emitClose:true});
      await new Promise((resolve)=>{
        sIn.pipe(
          preproc.createPreprocStream(
            {RELEASE:RELEASE},{strip:strip})
            .on("end",resolve)
        ).pipe(process.stdout)
        ;
      });
    }
  }
}
test();
