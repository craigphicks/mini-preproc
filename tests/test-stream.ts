`use strict`;
import stream =require('stream')
import { createPreprocStream } from '../dist/mini-preproc'
//const mpp=require('../dist/mini-preproc').createPreprocStream;
//import concat=require('concat-stream');

function* nextBuffer():Generator<Buffer,void,void>{
  let n=0;
  let charstr=(len:number)=>{
    let s='';
    for (let i=0;i<len;i++,n=(n+1)%10)
      s+=n.toString();
    return s;
  }; 
  try {
    while (true){
      let len1=Math.floor(Math.random()*10);
      let len2=Math.floor(Math.random()*10);
      let s= charstr(len1)+'\n'+charstr(len2);
      let buf=Buffer.from(s);
      yield buf; 
    }
  } catch(str){
    return;
  }
}

class MyReadable extends stream.Readable{
  termstr:string;
  count:number;
  nextbuf:Generator<Buffer,void,void>;
  constructor(termstr:string,options?:stream.ReadableOptions){
    super(options);
    this.termstr=termstr;
    this.count=0;
    this.nextbuf=nextBuffer();
  }
  _read(/*_size_advisory_*/) {
    for (;this.count<10;this.count++){
      if (!this.push(this.nextbuf.next().value))
        return;
    }
    this.push(this.termstr); 
    this.push(null);// EOF
    this.nextbuf.throw(null);
  }
}

var output=Buffer.from('');
function customWritable(){
  return new stream.Writable({
    write(chunk, encoding, callback) {
      output+=chunk;
      callback();
    },
  });
}

async function test(t:string):Promise<void>{
  return new Promise((resolve,reject)=>{
    output=Buffer.from('');
    (new MyReadable(t))
    .pipe(createPreprocStream({},{strip:false}))
    .pipe(customWritable()).on('finish',()=>{
      let str=output.toString();
      if (str[str.length-1]!=t)
        reject(new Error(str));
      resolve();            
    });
  });
}
async function main(){
  var proms:Promise<void>[]=[];
  await (async()=>{
    for (let i=0; i<1000;i++)
      proms.push(test('x').catch((e)=>{}));
  })();
  Promise.all(proms);
}
main();