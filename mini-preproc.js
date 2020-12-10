// copyright 2020, craigphicks, ISC license
'use strict';

const stream = require('stream');
class State{
  constructor(defs,opts={strip:false}){
    this.defs={...defs};
    this.opts={...opts};
    this.done=false;
    this.ifActive=false;
    this.ifTrue=false;
  }
  isDone(){ return this.done; }
  doLine(linein){
    let isCmd=false;
    let isPrefix=false;
    if (linein.substring(0,4)!=="//--"){
      // no change in state
    } else {
      isPrefix=true; 
      if (linein.substring(4,6)==="IF") {
        if (this.ifActive)
          throw new Error('unexpected IF');
        this.ifActive=true;
        let re=/\{\{\s*(\D\w+)\s*\}\}/.exec(linein.substring(6));
        if (!re || re.length<2)
          throw new Error(`invalid format ${linein.substring(4)}`);
        this.ifTrue=Object.keys(this.defs).includes(re[1])
          && this.defs[re[1]];
        isCmd=true;
      } else if (linein.substring(4,8)==="ELSE") {
        if (!this.ifActive)
          throw new Error('unexpected ELSE');
        this.ifTrue=!this.ifTrue;
        isCmd=true;
      } else if (linein.substring(4,9)==="ENDIF"){
        if (!this.ifActive)
          throw new Error('unexpected ENDIF');
        this.ifActive=false;
        isCmd=true;
      } else if (linein.substring(4,8)==="STOP"){
        if (this.ifActive)
          throw new Error('ENDIF required before STOP');
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


function createPreprocStream(defs,opts){                                                                      
  let xstream=new stream.Transform({objectMode:true,emitClose:true});
  xstream._state=new State(defs,opts);
  xstream._transform=function(chunk,_enc,callback){
    if (this._state.isDone()){
      if (this._leftover){                                                                                       
        this.push(this._leftover);                                                                              
        this.leftover=null;
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
    lines.forEach((line)=>{
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
  };                                                                                                          
  xstream._flush=function(callback){                                                                              
    if (this._leftover)                                                                                       
      this.push(this._leftover);                                                                              
    this.leftover=null;
    callback();                                                                                       
  };                                                                                                          
  return xstream;                                                                                             
}

module.exports.createPreprocStream=createPreprocStream;
