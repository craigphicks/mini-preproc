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
- When `strip` is false, the preproccer output can be run through the preprocessor again any `defines` and yield the correct result (\*).
  - *\*It is possible to write input which confuses the preprocessor (e.g. extra `//--`), however that is only possible before the first `STOP` command.

# Example

Suppose an input file `./test.txt` with content:
```
//passthru1
passthru2
//--IF{{RELEASE}}
//--const someModule=require('some-module');
//--const RELEASE_MODE=true;
//--ELSE
const someModule=require('./some-module.js');
const RELEASE_MODE=true;
//--ENDIF
//--STOP
// after STOP, no more preproc takes place
//--IF e.g., this malformed statement is not an error after STOP 
```
The following program writes display output for a variety of input parameters.  Only one property (`RELEASE`) is passed in the `defines` object argument, and it is set to either `true` or `false`.  *(Note: the `defines` keys can take on ANY valid key value.  The example choice of `RELEASE` is arbitrary.   The options keyword `strip` is set to either `true` or `false`. 
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
```
The resulting output is:
```
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
