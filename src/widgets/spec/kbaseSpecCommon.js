var newWorkspaceServiceUrlForSpec = 'http://140.221.84.170:7058/';

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
