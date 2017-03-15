/* eslint max-len: ["error", 100 ] */
/* global describe, beforeEach, afterEach, it, expect */
'use strict';

describe('Selenium Tutorial', function() {

    var selenium = require('selenium-webdriver');

    // Open the TECH.insight website in the browser before each test is run
    beforeEach(function(done) {
        this.driver = new selenium.Builder().
            withCapabilities(selenium.Capabilities.firefox()).
            build();
        this.driver.get('https://narrative.kbase.us/').then(done);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(function(done) {
        this.driver.quit().then(done);
    });

    // Test to ensure we are on the home page by checking for username input
    it('Should be on the login page', function(done) {
        this.driver.manage().timeouts().implicitlyWait(5 * 1000);
        var element = this.driver.findElement(selenium.By.name('username'));
        element.getAttribute('id').then(function(id) {
            expect(id).toBeDefined();
            done();
        });
    });

});
