'strict';
export{}// to stop typescript warning about duplicate declarations

import {createPreprocStream} from '../dist/index';
import {Readable} from 'stream'
import assert=require('assert')
let tests=[];
tests.push({
  in:`
//--IF // invalid format IF
`,
  expect:'MiniPreprocError: invalid format "IF // invalid format IF"'
})


for (let t of tests){
  Readable.from(t.in).pipe(
    createPreprocStream({},{strip:true}).on('error', (e:Error)=>{ 
      assert.strictEqual(e.message,t.expect); }
  ));
}

