/* eslint max-len: ["error", 100 ] */
/* global describe, beforeEach, afterEach, it, expect */
'use strict';

describe('Selenium Tutorial', function() {

    var selenium = require('selenium-webdriver');
    var timeoutMilliSec = 10 * 1000;

    // Open the TECH.insight website in the browser before each test is run
    beforeEach(function(done) {
        this.driver = new selenium.Builder().
            withCapabilities(selenium.Capabilities.phantomjs()).
            build();
        this.driver.manage().timeouts().implicitlyWait(timeoutMilliSec);
        jasmine.DEFAULT_TIMEOUT_INTERVAL = timeoutMilliSec;
        this.driver.get('http://localhost:9999/narrative/').then(done);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(function(done) {
        this.driver.quit().then(done);
    });

    // Test to ensure we are on the home page by checking for username input
    it('Should be on the narrative tree page', function(done) {
        var element = this.driver.findElement(selenium.By.id('signin-button'));
        element.getAttribute('id').then(function(id) {
            expect(id).toBeDefined();
            done();
        });
    });

});
