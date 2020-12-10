'use strict';

function getInputText(){
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

// function getExpected({RELEASE,strip}){
//   if (!RELEASE&&!strip)
//     return  `\
// //aaaaaaaaaaaaa
// //bbbbbbbbbbbbb
// //--IF{{RELEASE}}
// //--// ordinary comment 1
// //--const jsLci=require('jsLci');
// //--ELSE
// // ordinary comment 2
// const jsLci=require('..index');
// //--ENDIF
// //ccccccccccccc
// //ddddddddddddd
// `;
//   else if (!RELEASE&&strip)
//     return  `\
// //aaaaaaaaaaaaa
// //bbbbbbbbbbbbb
// // ordinary comment 2
// const jsLci=require('..index');
// //ccccccccccccc
// //ddddddddddddd  
// `;
//   else if (RELEASE&&!strip)
//     return  `\
// //aaaaaaaaaaaaa
// //bbbbbbbbbbbbb
// //--IF{{RELEASE}}
// // ordinary comment 1
// const jsLci=require('jsLci');
// //--ELSE
// //--// ordinary comment 2
// //--const jsLci=require('..index');
// //--ENDIF
// //ccccccccccccc
// //ddddddddddddd  
// `;
//   else if (RELEASE&&strip)
//     return  `\
// //aaaaaaaaaaaaa
// //bbbbbbbbbbbbb
// // ordinary comment 1
// const jsLci=require('jsLci');
// //ccccccccccccc
// //ddddddddddddd
// `;
// }


module.exports.getInputText=getInputText;
