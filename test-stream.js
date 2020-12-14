`use strict`;
const { Readable }=require('stream');
const mpp=require('./mini-preproc.js').createPreprocStream;
const concat=require('concat-stream');
function* nextBuffer(){
  let n=0;
  let charstr=(len)=>{
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

class MyReadable extends Readable{
  constructor(termstr,options){
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

async function test(){
  let t='x';
  let check=(buf)=>{
    let str=buf.toString();
    if (str[str.length-1]!=t)
      throw new Error(buf);
  };
  (new MyReadable(t)).pipe(mpp({},false)).pipe(concat(check));
}
async function main(){
  for (let i=0; i<1000;i++)
    test();
}
main();