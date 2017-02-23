/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'api/auth',
    'narrativeConfig'
], function(
    Auth,
    Config
) {
    'use strict';

    var authClient;
    beforeEach(function() {
        authClient = Auth.make({url: Config.url('auth')});
    });

    describe('Test the Auth API module', function() {
        it('Should make a new Auth client on request', function() {
            var auth = Auth.make({url: Config.url('auth')});
            expect(auth).not.toBeNull();
        });

        it('Should get auth token info', function(done) {
            var token = '';
            authClient.getTokenInfo(token)
            .then(function(response) {
                done();
            })
            .catch(function(error) {
                expect(error).toBeNull();
                done();
            });
        });
    });
});
