global.jQuery = require("jquery");
global.$      = jQuery;

require("../src/kbase.js");

describe("KBApplication", function () {
    it("should exist", function () {
        $.KBApplication.should.be.a.function;
    });
});