var util   = require("util");
global.jQuery = require("jquery");
global.$      = jQuery;

require("../src/kbase.js");

describe("widget", function () {
    it("should be a function", function () {
        $.kbWidget.should.be.a("function");
    });
});
