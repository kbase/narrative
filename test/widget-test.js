global.jQuery = require("jquery");
global.$      = jQuery;
var jsdom     = require("jsdom");
global.window = jsdom.jsdom().parentWindow;

require("../src/kbwidget.js");
// TODO: Reset jQuery namespaces for each test.

describe("KBWidget", function () {
    beforeEach(function (done) {
        $.KBWidget.resetRegistry();
        done();
    });
    
    it("should be a function",
    function (done) {
        $.KBWidget.should.be.a.function;
        done();
    });

    it("should support an empty constructor",
    function (done) {
        $.KBWidget().should.not.be.null;
        done();
    });

    it("should expose the 'name' as a plugin",
    function (done) {
        var widget = $.KBWidget({
            name: "NewKBWidget"
        });
        $.fn.NewKBWidget.should.be.a.function;
        done();
    });

    it("should allow a parent to be specified as a property",
    function (done) {
        var parent = $.KBWidget({
            name: "ParentWidget1"
        });
        var child = $.KBWidget({
            name: "ChildWidget1",
            parent: "ParentWidget1"
        });
        child.should.be.a.function;
        done();
    });

    it("should allow a widget to extend by specifying a parent",
    function (done) {
        $.KBWidget({
            name: "ParentWidget2"
        });
        $.KBWidget({
            name: "ChildWidget2",
            parent: "ParentWidget2"
        });
        $.fn.ChildWidget2.should.be.a.function;
        done();
    });

    it("should throw a useful message if a parent isn't registered",
    function (done) {
        (function () {
            $.KBWidget({
                name: "HelloWidget",
                parent: "NonExistentWidget"
            })
        }).should.throw("Parent widget is not registered");
        done();
    });

    it("should allow events to be emitted",
    function (done) {
        var widget = $.KBWidget();
        widget.on.should.be.a.function;
        widget.off.should.be.a.function;
        widget.emit.should.be.a.function;
        done();
    });
    
    it("should export a registry of available widgets", function (done) {
        $.KBWidget.registry.should.be.a.function;
        $.KBWidget({ name: "RegWidget1" });
        $.KBWidget({ name: "RegWidget2" });
        $.KBWidget({ name: "RegWidget3" });
        var widgets = $.KBWidget.registry();
        widgets.should.be.an.object;
        Object.keys(widgets).should.have.length(3);
        done();
    });
    
    it("should allow the registry to be reset", function (done) {
        Object.keys($.KBWidget.registry()).should.have.length(0);
        $.KBWidget({ name: "MyWidget1" });
        $.KBWidget({ name: "MyWidget2" });
        $.KBWidget({ name: "MyWidget3" });
        Object.keys($.KBWidget.registry()).should.have.length(3);
        $.KBWidget.resetRegistry();
        Object.keys($.KBWidget.registry()).should.have.length(0);
        done();
    })
});
