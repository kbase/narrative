global.jQuery = require("jquery");
global.$      = jQuery;
var jsdom     = require("jsdom");
global.window = jsdom.jsdom().parentWindow;

require("../src/kbwidget.js");
require("../src/kbapplication.js");

describe("KBApplication", function () {
    it("should exist", function () {
        $.KBApplication.should.be.a.function;
    });
    it("should extend KBWidget", function () {
        var app = $.KBApplication();
        // app.should.be.instanceOf(w);
    });
});