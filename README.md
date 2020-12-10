copyright 2020, craigphicks, ISC license

MiniPreproc
----

# Outline
- A simple, light, and fast text preprocessor implemented as a node transform stream.
- Speed is ensured by only pre-processing upto a STOP command.  After the STOP command, the MiniPreproc transform stream stops parsing lines and simply passes each "chunk" to output with no processing.  That is as fast a transform stream can possibly work.
- The available commands are `IF`, `ELSE`, `ENDIF`, and `STOP`.  Only one level of IF condition is allowed.
- Each command must be prefixed by `//--` from the start of the line, with no spaces before the command. (Currently the choice of prefix is fixed.)
 - There is a progratic interface `createPreprocStream`. (Currently there is no CLI interface).  See below API section for details.
 

# Example

Suppose an input file `./test.txt` with content:
```
//aaaaaaaaaaaaa
//bbbbbbbbbbbbb
//--IF{{RELEASE}}
//--// ordinary comment 1
//--const someModule=require('some-module');
//--ELSE
// ordinary comment 2
const someModule=require('./some-module.js');
//--ENDIF
//--STOP
//ccccccccccccc
//ddddddddddddd
// after STOP, no more preproc takes place
//--IF this is not an error after STOP 
```

```
const fs=require('fs');
const preproc=require('mini-preproc');
async function test(){
  for (const RELEASE of [true,false]){
    for (const strip of [true,false]){
      process.stdout.write(`-----------------------\n`)
      process.stdout.write(`RELEASE=${RELEASE},strip=${strip}\n`)
      process.stdout.write(`-----------------------\n`)
      let sIn=fs.createReadStream('./test.txt',{emitClose:true});
      sIn.pipe(
        preproc.createPreprocStream(
          {RELEASE:RELEASE},{strip:strip})
      ).pipe(process.stdout);
    }
  }
}
```
Then the output will be:
```
-----------------------
RELEASE=true,strip=true
-----------------------
//aaaaaaaaaaaaa
//bbbbbbbbbbbbb
// ordinary comment 1
const someModule=require('some-module');
//ccccccccccccc
//ddddddddddddd
// after STOP, no more preproc takes place
//--IF this is not an error after STOP 
-----------------------
RELEASE=true,strip=false
-----------------------
//aaaaaaaaaaaaa
//bbbbbbbbbbbbb
//--IF{{RELEASE}}
// ordinary comment 1
const someModule=require('some-module');
//--ELSE
//--// ordinary comment 2
//--const someModule=require('./some-module.js');
//--ENDIF
//--STOP
//ccccccccccccc
//ddddddddddddd
// after STOP, no more preproc takes place
//--IF this is not an error after STOP 
-----------------------
RELEASE=false,strip=true
-----------------------
//aaaaaaaaaaaaa
//bbbbbbbbbbbbb
// ordinary comment 2
const someModule=require('./some-module.js');
//ccccccccccccc
//ddddddddddddd
// after STOP, no more preproc takes place
//--IF this is not an error after STOP 
-----------------------
RELEASE=false,strip=false
-----------------------
//aaaaaaaaaaaaa
//bbbbbbbbbbbbb
//--IF{{RELEASE}}
//--// ordinary comment 1
//--const someModule=require('some-module');
//--ELSE
// ordinary comment 2
const someModule=require('./some-module.js');
//--ENDIF
//--STOP
//ccccccccccccc
//ddddddddddddd
// after STOP, no more preproc takes place
//--IF this is not an error after STOP 
```

# API 
- import 
  - `const miniPreproc=require('mini-preproc');`
- `miniPreproc.createPreprocStream(defines,options)`
  - return value is a node transform stream, suitable for piping
  - `defines` is an object whose properties (or their absence) is used to evaluate boolean `IF` conditions in the stream's input text. An absent property evaluates to `false`.  Other values are converted to `true` or `false` according to normal javascript rules 
  - `options` has a single valid property: `strip`.  When `strip` is true all the command lines are removed from output. Otherwise they remain. 


