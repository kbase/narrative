var newWorkspaceServiceUrlForSpec = 'http://140.221.84.209:7058/';
//var newWorkspaceServiceUrlForSpec = 'http://Romans-MacBook-Pro-4.local:9999/';

PR['registerLangHandler'](
	    PR['createSimpleLexer'](
	        [
	         // Whitespace
	         [PR['PR_PLAIN'],       /^[\t\n\r \xA0]+/, null, '\t\n\r \xA0'],
	         // A double or single quoted, possibly multi-line, string.
	         [PR['PR_STRING'],      /^(?:"(?:[^\"\\]|\\.)*"|'(?:[^\'\\]|\\.)*')/, null,
	          '"\'']
	        ],
	        [
	         [PR['PR_COMMENT'], /^(?:\/\*[\s\S]*?(?:\*\/|$))/],
	         [PR['PR_KEYWORD'], /^\b(?:module|typedef|funcdef|authentication|returns)\b/, null],
	         // A number is a hex integer literal, a decimal real literal, or in
	         // scientific notation.
	         [PR['PR_LITERAL'],
	          /^\b(?:string|int|float|UnspecifiedObject|list|mapping|structure|tuple)\b/],
	         // An identifier
	         [PR['PR_PLAIN'], /^[a-z_][\w-]*/i],
	         // A run of punctuation
	         [PR['PR_PUNCTUATION'], /^[^\w\t\n\r \xA0\"\'][^\w\t\n\r \xA0+\-\"\']*/]
	        ]),
	    ['spec']);

function replaceMarkedTypeLinksInSpec(curModule, specText, aClass) {
    var patt = /#[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+-[0-9]+\.[0-9]+#/;
    while (true) {
    	var m = patt.exec(specText);
    	if (m === null)
    		break;
    	m = m[0];
    	var pos = specText.indexOf(m);
    	var id = m.substr(1, m.length - 2);
    	var name = id.substring(0, id.indexOf('-'));
    	var module = name.substring(0, name.indexOf('.'));
    	if (module === curModule) {
    		name = name.substr(name.indexOf('.') + 1);
    	}
    	var link = '<a class="'+aClass+'" data-typeid="'+id+'">'+name+'</a>';
    	specText = specText.substr(0, pos) + link + specText.substr(pos + m.length);
    }
    return specText;
}
