global.jQuery = require("jquery");
global.$      = jQuery;

// require("../src/kbapplication.js");

describe("KBApplication", function () {
    it("should exist", function () {
        $.KBApplication.should.be.a.function;
    });
});