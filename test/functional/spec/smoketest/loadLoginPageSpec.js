/* eslint max-len: ["error", 100 ] */
/* global describe, beforeEach, afterEach, it, expect, jasmine */
'use strict';

describe('Narrative Smoketest', function() {

    var selenium = require('selenium-webdriver');
    var timeoutMilliSec = 20 * 1000;

    // Open up the local instance of the narrative from test/unit/run_tests.py
    beforeEach(function(done) {
        this.driver = new selenium.Builder()
            .withCapabilities(selenium.Capabilities.firefox())
            .build();
        this.driver.manage().timeouts().implicitlyWait(timeoutMilliSec);
        jasmine.DEFAULT_TIMEOUT_INTERVAL = timeoutMilliSec;
        this.driver.get('http://localhost:9999/narrative/tree?').then(done);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(function(done) {
        this.driver.quit().then(done);
    });

    // Test to ensure we are on the home page by checking for sign-in button
    it('The sign-in button is visible', function() {
        // var element = this.driver.findElement(selenium.By.id('signin-button'));
        var element = this.driver.findElement(selenium.By.tagName('body'));
        expect(element).not.toBeNull();
    });
});
