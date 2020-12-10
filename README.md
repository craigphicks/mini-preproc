copyright 2020, craigphicks, ISC license

MiniPreproc
----

# Outline
- A simple, light, and fast text preprocessor implemented as a node transform stream.
- Speed is ensured by only pre-processing upto a `STOP` command.  After the `STOP` command, the MiniPreproc transform stream stops parsing lines and simply passes each "chunk" to output with no processing.  That is as fast a transform stream can possibly work.
- The available commands are `IF`, `ELSE`, `ENDIF`, and `STOP`.  Only one level of IF condition is allowed.
- Each command must be prefixed by `//--` from the start of the line, with no spaces before the command. (Currently the choice of prefix is fixed.)
- There is a progmatic interface `createPreprocStream`. (Currently there is no CLI interface provided).  See API section for details.
- The `strip` option allows all directives to be removed, so the output looks clean.
- When `strip` is false, the preproccer output can be run through the preprocessor again with any `defines` and yield the correct result (\*).
  - *\*Yes, it is possible to write input which confuses the preprocessor (e.g. extra `//--`), however that is only possible before the first `STOP` command, so it is not a problem in practice.**

# Example

Suppose an input file `./demo-test.txt` with content:
```text
<stuff before>
//--IF{{RELEASE}}
//--const someModule=require('some-module');
//--const RELEASE_MODE=true;
//--ELSE
const someModule=require('./some-module.js');
const RELEASE_MODE=false;
//--ENDIF
//--STOP
<stuff after>
```
The following example CLI program `demo.js` pipes `stdin` through `miniPreproc`, to `stdout`, while passing CLI parameters to `miniPreproc`.  
```js
'use strict';
const preproc=require('./mini-preproc.js');
async function mpp(defines,strip){
  process.stdin.pipe(
    preproc.createPreprocStream(
      defines,{strip:strip}))
    .on('error',(e)=>{ console.log(e.message);})      
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

*WARNING: [In the vscode debugger, output to process.stdout is NOT normally shown in the 'DEBUG CONSOLE' window.](#printing-to-processstdout-from-vscode-in-debug-mode)*

# API 
- import 
  - `const miniPreproc=require('mini-preproc');`
- `miniPreproc.createPreprocStream(defines,options)`
  - return value is a node transform stream, suitable for piping
  - `defines` is an object containing zero or more property-value pairs which are used to evaluate the preprocessor `IF` conditions in the stream's input text. An absent property evaluates to `false`.  Other values are converted to `true` or `false` according to normal javascript rules
    - See [Preprocessor syntax](#preprocessor-syntax) for details about preprocesser directives.  
  - `options` has a single valid property: `strip`.  When `strip` is true all the command lines are removed from output. Otherwise they remain. 
  - the returned stream may throw an error on illegal preprocessor syntax.  [How to catch a stream error](#how-to-catch-a-stream-error) in the appendix shows one way to handle that. 

## Preprocessor syntax
- All directives are on a single line, `//--<directive>` with no spaces before `//--`, and `<directive>` in [`IF`,`ELSE`,`ENDIF`,`STOP`].
- Any text outside of `IF-ELSE-ENDIF` block lines is passed through.
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
  - else if `options.strip` evaluates to true
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
  - else if `options.strip` evaluates to true
    - Output 
    ```
    //--IF{{<key>}} 
    <text-block-true> with '//--' line prefixes required
    //--ELSE
    <text-block-false> with '//--' line prefixes removed
    //--ENDIF
    ```

- examples of `<text-block-*> with '//--' line prefixes removed`
  - Has
  ```
  //--xxxx
  ```
  becomes 
  ```
  xxx
  ```
  - Already doesn't have
  ```
  yyyy
  ```
  stays as  
  ```
  yyyy
  ```
- examples of `<text-block-false> with '//--' line prefixes required`
  - Already has
  ```
  //--xxxx
  ```
  stays as 
  ```
  //--xxxx
  ```
  - Doesn't have
  ```
  yyyy
  ```
  becomes  
  ```
  //--yyyy
  ```

# Appendix
## Printing to process.stdout from vscode in debug mode.
When a program is started by the `vscode` debugger, output to `process.stdout` is NOT shown in the 'DEBUG CONSOLE' window.  See 'outputCapture' at https://code.visualstudio.com/docs/nodejs/nodejs-debugging . However, the easiest solution is to start the program from outside the debugger with `node --inspect-brk my-prog.js` and then attach that process from vscode - the output to `process.stdout` will then show correctly in the terminal from which node was invoked.
