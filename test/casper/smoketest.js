/* global casper, phantom */

var fs = require('fs');
// var utils = require('utils');
var token = fs.read('test/wjriehl.tok').trim();
// utils.dump(data);

casper.test.begin('Can open sample narrative', 2, function suite(test) {
    casper.echo(token);
    phantom.addCookie({
        'name': 'kbase_session',
        'value': token,
        'domain': 'localhost',
        'path': '/'
    });

    casper.start('http://localhost:8888/narrative/ws.25022.obj.1');

    casper.waitWhileVisible('#kb-loading-blocker', function() {
        test.assertTitle('Scratch');
    });

    casper.then(function() {
        test.assertSelectorHasText('span#kb-narr-creator', 'William Riehl');
    });

    casper.run(function() {
        test.done();
    });
});
