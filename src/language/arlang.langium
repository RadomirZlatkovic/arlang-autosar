grammar Arlang

entry Model:
    (packages+=Package)*
;

Package:
    '#package' name=FQN
        (elements+=Element)*
    '#end'
;

Element:
    Interface | SwComponent
;

Interface:
    'interface' ':' type=InterfaceType name=ID '{'
        arlangModId=ArlangModificationId?
    '}'
;

SwComponent:
    'swComponent' ':' type=SwComponentType name=ID '{'
        ports+=Port*
        arlangModId=ArlangModificationId?
    '}'
;

Port:
    'port' ':' type=PortType name=ID 'implements' interfaceRef=[Interface:FQN] '{'
        arlangModId=ArlangModificationId?
    '}'
;

ArlangModificationId:
    'arlangModId' ':' id=STRING
;

InterfaceType returns string:
    'senderReceiver' |
    'clientServer'
;

SwComponentType returns string:
    'application'
;

PortType returns string:
    'provided' | 'required'
;

FQN returns string:
    ID ('.' ID)*
;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
