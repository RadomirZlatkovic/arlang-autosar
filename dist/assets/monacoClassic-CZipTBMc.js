import{d as o,c as t,M as r,a}from"./wrapper-Bt728_s-.js";/* empty css               */const i={keywords:["#end","#package","application","arlangModId","clientServer","implements","interface","port","provided","required","senderReceiver","swComponent"],operators:[".",":"],symbols:/\.|:|\{|\}/,tokenizer:{initial:[{regex:/[_a-zA-Z][\w_]*/,action:{cases:{"@keywords":{token:"keyword"},"@default":{token:"ID"}}}},{regex:/[0-9]+/,action:{token:"number"}},{regex:/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/,action:{token:"string"}},{include:"@whitespace"},{regex:/@symbols/,action:{cases:{"@operators":{token:"operator"},"@default":{token:""}}}}],whitespace:[{regex:/\s+/,action:{token:"white"}},{regex:/\/\*/,action:{token:"comment",next:"@comment"}},{regex:/\/\/[^\n\r]*/,action:{token:"comment"}}],comment:[{regex:/[^/\*]+/,action:{token:"comment"}},{regex:/\*\//,action:{token:"comment",next:"@pop"}},{regex:/[/\*]/,action:{token:"comment"}}]}},c=()=>({wrapperConfig:{serviceConfig:o(),editorAppConfig:{$type:"classic",languageId:"arlang",code:"// arlang is running in the web!",useDiffEditor:!1,languageExtensionConfig:{id:"langium"},languageDef:i,editorOptions:{"semanticHighlighting.enabled":!0,theme:"vs-dark"}}},languageClientConfig:t()}),s=async e=>{const n=c();await new r().initAndStart(n,e)};a();s(document.getElementById("monaco-editor-root"));
