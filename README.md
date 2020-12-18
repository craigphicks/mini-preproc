copyright 2020, craigphicks, ISC license

MiniPreproc
----

# Outline
- A simple, light, and fast text preprocessor implemented as a node transform stream.
- Speed is ensured by only pre-processing upto a `STOP` command.  After the `STOP` command, the MiniPreproc transform stream stops parsing lines and simply passes each "chunk" to output with no processing.  That is as fast a transform stream can possibly work.
- The available commands are `IF`, `ELSE`, `ENDIF`, and `STOP`.  Only one level of IF condition is allowed.
- An `IF` command is followed by a property: `IF{{<key>}}`, with true/false looked up in dictionary passed in by the caller.  
- Each command must be prefixed by `//--` from the start of the line, with no spaces before the command. (Currently the choice of prefix is fixed.)
- There is a progmatic interface `createPreprocStream`. (Currently there is no CLI interface provided).  See API section for details.
- The `strip` option allows all directives to be removed, so the output looks clean.
- When `strip` is false, the preproccer output can be run through the preprocessor again with any `defines` and yield the correct result (\*).
  - *\*Yes, it is possible to write input which confuses the preprocessor (e.g. extra `//--`), however that is only possible before the first `STOP` command, so it is not a problem in practice.*

# Install
`mini-preproc` would most likely be used as a dev tool, so installation as a dev depency is demonstrated:
```
npm install mini-preproc --save-dev
```

# Example

Suppose an input file `./demo-test.txt` with content:
```text
...before
//--IF{{RELEASE}}
//--const someModule=require('some-module');
//--const RELEASE_MODE=true;
//--ELSE
const someModule=require('./some-module.js');
const RELEASE_MODE=false;
//--ENDIF
//--STOP
...after
```
The following example CLI program `demo-cli.js` pipes `stdin` through the stream created by `createPreprocStream`, to `stdout`, while also passing CLI parameters to that stream.  
```js
'use strict';
const {createPreprocStream}=require('mini-preproc');
async function mpp(defines,strip){
  process.stdin.pipe(
    createPreprocStream(
      defines,{strip:strip}))
    .on('error',(e)=>{
      console.error(e.message);
      process.exitCode=1;
    })
    .pipe(process.stdout);
}
var defines=JSON.parse(process.argv[2]);
var strip=!!JSON.parse(process.argv[3]);
mpp(defines,strip);
```

Some runs of the program:
```
$ node demo-cli.js '{"RELEASE":true}' true < ./demo-test.txt
...before
const someModule=require('some-module');
const RELEASE_MODE=true;
...after
```
```
$ node demo-cli.js '{"RELEASE":false}' true < ./demo-test.txt
...before
const someModule=require('./some-module.js');
const RELEASE_MODE=true;
...after
```
```
$ node demo-cli.js '{"RELEASE":true}' false < ./demo-test.txt
...before
//--IF{{RELEASE}}
const someModule=require('some-module');
const RELEASE_MODE=true;
//--ELSE
//--const someModule=require('./some-module.js');
//--const RELEASE_MODE=true;
//--ENDIF
//--STOP
...after
```
```
$ node demo-cli.js '{"RELEASE":false}' false < ./demo-test.txt
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
```

A typescript version of the program is [listed in the appendix](#typescript-version-of-the-example-program)

*WARNING: [If using vscode debugger, output to process.stdout is NOT normally shown in the 'DEBUG CONSOLE' window.](#printing-to-processstdout-from-vscode-in-debug-mode)*

# API 
- import 
  - `const miniPreproc=require('mini-preproc');`
- `miniPreproc.createPreprocStream(defines,options)`
  - return value is a node transform stream, suitable for piping
  - `defines` is an object containing zero or more property-value pairs which are used to evaluate the preprocessor `IF` conditions in the stream's input text. An absent property evaluates to `false`.  Other values are converted to `true` or `false` according to normal javascript rules
    - See [Preprocessor syntax](#preprocessor-syntax) for details about preprocesser directives.  
  - `options` has a single valid property: `strip`.  When `strip` is true all the command lines are removed from output. Otherwise they remain. 
  - the returned stream may throw an error on illegal preprocessor syntax.  The error is of class `MiniPreprocError`, derived from type `Error`. 

## Preprocessor syntax
- All directives are on a single line, `//--<directive>` with no spaces before `//--`, and `<directive>` in [`IF`,`ELSE`,`ENDIF`,`STOP`].
- Any text outside of an `IF-ELSE-ENDIF` block of lines is passed through.
- Any text after the first `STOP` directive line is passed through.

Consider:
```
//--IF{{<key>}} 
<text-block-true>
//--ELSE
<text-block-false>
//--ENDIF
```
- If `(<key> in defines)` evaluates to true
  - If `options.strip` evaluates to true
    - Output 
    ```
    <<text-block-true>> with any `//--` line prefixes removed 
    ```
  - else if `options.strip` evaluates to false
    - Output 
    ```
    //--IF{{<key>}} 
    <text-block-true> with '//--' line prefixes removed
    //--ELSE
    <text-block-false> with '//--' line prefixes required
    //--ENDIF
    ```
- else if `(<key> in defines)` evaluates to false
  - If `options.strip` evaluates to true
    - Output 
    ```
    <<text-block-false>> with any `//--` line prefixes removed 
    ```
  - else if `options.strip` evaluates to false
    - Output 
    ```
    //--IF{{<key>}} 
    <text-block-true> with '//--' line prefixes required
    //--ELSE
    <text-block-false> with '//--' line prefixes removed
    //--ENDIF
    ```

- examples of `<text-block-*> with '//--' line prefixes removed`
  - Case: Has `//--` prefix
  ```
  //--xxxx
  ```
  becomes 
  ```
  xxx
  ```
  - Case: Already doesn't have `//--` prefix
  ```
  yyyy
  ```
  stays as  
  ```
  yyyy
  ```
- examples of `<text-block-false> with '//--' line prefixes required`
  - Case: Already has `//--` prefix
  ```
  //--xxxx
  ```
  stays as 
  ```
  //--xxxx
  ```
  - Case: Doesn't have `//--` prefix
  ```
  yyyy
  ```
  becomes  
  ```
  //--yyyy
  ```

# Typescript

The typescript declaration are bundled with the package.  (They are not provided seperately under npm @types).

An example typescript program using the `mini-preproc` typescript delared argument types is [listed in the appendix](#typescript-version-of-the-example-program).  

# version changes
## 1.1.0
- typescript definitions added
- supports "node": ">=10.13.0"

# Appendix
## Printing to process.stdout from vscode in debug mode.
When a program is started by the `vscode` debugger, output to `process.stdout` is NOT shown in the 'DEBUG CONSOLE' window.  See 'outputCapture' at https://code.visualstudio.com/docs/nodejs/nodejs-debugging . However, the easiest solution is to start the program from outside the debugger with `node --inspect-brk my-prog.js` and then attach that process from vscode - the output to `process.stdout` will then show correctly in the terminal from which node was invoked.

## Typescript version of the example program

```typescript
'use strict'
import mpp=require('mini-preproc'); 
async function mppCli(defines:mpp.Defs,strip:boolean){
  process.stdin.pipe(
    mpp.createPreprocStream(
      defines,{strip:strip}))
    .on('error',(e)=>{
      console.error(e.message);
      process.exitCode=1;
    })
    .pipe(process.stdout);
}
var defines=JSON.parse(process.argv[2]);
var strip=!!JSON.parse(process.argv[3]);
mppCli(defines,strip);
```
