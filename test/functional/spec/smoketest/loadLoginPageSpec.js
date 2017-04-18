/* eslint max-len: ["error", 100 ] */
/* global describe, beforeEach, afterEach, it, expect, jasmine */
'use strict';

describe('Narrative Smoketest', function() {

    var selenium = require('selenium-webdriver');
    var timeoutMilliSec = 10 * 1000;

    // Open up the local instance of the narrative from test/unit/run_tests.py
    beforeEach(function(done) {
        this.driver = new selenium.Builder()
            .withCapabilities(selenium.Capabilities.firefox())
            .build();
        this.driver.manage().timeouts().implicitlyWait(timeoutMilliSec);
        jasmine.DEFAULT_TIMEOUT_INTERVAL = timeoutMilliSec;
        this.driver.get('http://localhost:9999/narrative/').then(done);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(function(done) {
        this.driver.quit().then(done);
    });

    // Test to ensure we are on the home page by checking for sign-in button
    it('The sign-in button is visible', function(done) {
        var element = this.driver.findElement(selenium.By.id('signin-button'));
        element.getText().then( function(text){
            expect(text).toContain('Sign In');
            done();
        });
    });

    it('Clicking signin brings up modal dialog', function(done) {
        var element = this.driver.findElement(selenium.By.id('signin-button'));
        element.click();
        var element2 = this.driver.findElement(selenium.By.css('[data-id="user_id"]'));
        element2.isDisplayed().then(function( displayed) {
            expect(displayed).toBeTruthy();
            done();
        });

    });
});
