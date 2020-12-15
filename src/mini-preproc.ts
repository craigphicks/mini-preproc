// copyright 2020, craigphicks, ISC license
'use strict';
import stream from 'stream'
class MiniPreprocError extends Error {
  constructor(msg:string){
    super("MiniPreprocError: "+msg);
  }
}
type Defs = Record<string,boolean>
interface Opts { strip: boolean }

//const stream = require('stream');
class State{
    defs:Defs
    opts:Opts
    done:boolean
    ifActive:boolean
    ifTrue:boolean
  constructor(defs:Defs,opts:Opts={strip:false}){
    this.defs={...defs};
    this.opts={...opts};
    this.done=false;
    this.ifActive=false;
    this.ifTrue=false;
  }
  isDone(){ return this.done; }
  doLine(linein:string){
    let isCmd=false;
    let isPrefix=false;
    if (linein.substring(0,4)!=="//--"){
      // no change in state
    } else {
      isPrefix=true;
      if (linein.substring(4,6)==="IF") {
        if (this.ifActive)
          throw new MiniPreprocError('unexpected IF');
        this.ifActive=true;
        let re=/\{\{\s*(\D\w+)\s*\}\}/.exec(linein.substring(6));
        if (!re || re.length<2)
          throw new MiniPreprocError(`invalid format "${linein.substring(4)}"`);
        this.ifTrue=Object.keys(this.defs).includes(re[1])
          && this.defs[re[1]];
        isCmd=true;
      } else if (linein.substring(4,8)==="ELSE") {
        if (!this.ifActive)
          throw new MiniPreprocError('unexpected ELSE');
        this.ifTrue=!this.ifTrue;
        isCmd=true;
      } else if (linein.substring(4,9)==="ENDIF"){
        if (!this.ifActive)
          throw new MiniPreprocError('unexpected ENDIF');
        this.ifActive=false;
        isCmd=true;
      } else if (linein.substring(4,8)==="STOP"){
        if (this.ifActive)
          throw new MiniPreprocError('ENDIF required before STOP');
        isCmd=true;
        this.done=true;
      }
    }
    if (isCmd)
      return (this.opts.strip?null:linein);
    if (!this.ifActive)
      return linein;
    if (!this.ifTrue){
      if (this.opts.strip)
        return null;
      return isPrefix ? linein : '//--'+linein;
    }
    return isPrefix ? linein.substring(4) : linein;
  } // do line
}

class MiniPreprocTransform extends stream.Transform{
  _state:State
  _leftover:string
  constructor(defs:Defs,opts:Opts){
    super();
    this._state=new State(defs,opts);
    this._leftover='';
  }
  _transform(chunk:any,_enc:any,callback:(e?:Error)=>void){
    try {
      if (this._state.isDone()){
        if (this._leftover){
          this.push(this._leftover);
          this._leftover='';
        }
        this.push(chunk);
        callback();
        return;
      }
      let str=chunk.toString();
      if (this._leftover)
        str=this._leftover+str;
      let lines=str.split('\n');
      this._leftover=lines.splice(-1,1)[0];
      lines.forEach((line:string)=>{
        if (this._state.isDone()){
          this.push(line+'\n');
          return;// from iter of forEach
        }
        let out=this._state.doLine(line);
        if (out===null)
          return;// from iter of forEach
        if (!Array.isArray(out)){
          this.push(out+'\n');
          return;// from iter of forEach
        }
        out.forEach((x)=>{
          this.push(x+'\n');
        });
      });
      callback();
    } catch(e) {
      callback(e);
      //this.emit("error",e);
    }
  };
  _flush(callback:()=>void){
    if (this._leftover)
      this.push(this._leftover);
    this._leftover='';
    callback();
  };
}

function createPreprocStream(defs:Defs,opts:Opts):MiniPreprocTransform{
  return new MiniPreprocTransform(defs,opts);
}


// function createPreprocStream(defs:Defs,opts:Opts):any{
//   let xstream=new stream.Transform({objectMode:true,emitClose:true});
//   xstream._state=new State(defs,opts);
//   xstream._transform=function(chunk:any,_enc:any,callback:()=>void){
//     try {
//       if (this._state.isDone()){
//         if (this._leftover){
//           this.push(this._leftover);
//           this.leftover=null;
//         }
//         this.push(chunk);
//         callback();
//         return;
//       }
//       let str=chunk.toString();
//       if (this._leftover)
//         str=this._leftover+str;
//       let lines=str.split('\n');
//       this._leftover=lines.splice(-1,1)[0];
//       lines.forEach((line:string)=>{
//         if (this._state.isDone()){
//           this.push(line+'\n');
//           return;// from iter of forEach
//         }
//         let out=this._state.doLine(line);
//         if (out===null)
//           return;// from iter of forEach
//         if (!Array.isArray(out)){
//           this.push(out+'\n');
//           return;// from iter of forEach
//         }
//         out.forEach((x)=>{
//           this.push(x+'\n');
//         });
//       });
//       callback();
//     } catch(e) {
//       this.emit("error",e);
//     }
//   };
//   xstream._flush=function(callback:()=>void){
//     if (this._leftover)
//       this.push(this._leftover);
//     this.leftover=null;
//     callback();
//   };
//   return xstream;
// }

export type {MiniPreprocError,Defs,Opts,MiniPreprocTransform} // ts types
export {createPreprocStream} // function
//module.exports.createPreprocStream=createPreprocStream;
