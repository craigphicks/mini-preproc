'use strict';

function getInputText():string{
  return  `\
//aaaaaaaaaaaaa
//bbbbbbbbbbbbb
//--IF{{RELEASE}}
//--// ordinary comment 1
//--const jsLci=require('jsLci');
//--ELSE
// ordinary comment 2
const jsLci=require('..index');
//--ENDIF
//--STOP
//ccccccccccccc
//ddddddddddddd
// after STOP, no more preproc should take place
//--IF{{RELEASE}}
//--// ordinary comment 1
//--const jsLci=require('jsLci');
//--ELSE
// ordinary comment 2
const jsLci=require('..index');
//--ENDIF
//--STOP

`;
}
export {getInputText}
//module.exports.getInputText=getInputText;
