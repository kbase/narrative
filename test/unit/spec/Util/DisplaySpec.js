/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'jquery',
    'util/display',
    'narrativeConfig',
    'util/string'
], function(
    $,
    DisplayUtil,
    Config,
    StringUtil
) {
    'use strict';

    describe('KBase Display Utility function module', function() {
        let $nameTarget,
            profilePageUrl = Config.url('profile_page');

        beforeEach(() => {
            $nameTarget = $('<div>');

            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $nameTarget.remove();
        });

        it('displayRealName should display a real name with link to user page', (done) => {
            let userId = 'testuser',
                fullName = 'Test User',
                response = {};
            response[userId] = fullName;
            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list=testuser/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(response)
            });
            DisplayUtil.displayRealName(userId, $nameTarget)
                .then(() => {
                    expect($nameTarget.html()).toContain(userId);
                    expect($nameTarget.html()).toContain(fullName);
                    expect($nameTarget.html()).toContain('(<a href="' + profilePageUrl + userId + '" target="_blank">' + userId + '</a>)');
                    done();
                });
        });

        it('displayRealName should display whatever text name it gets back', (done) => {
            let userId = 'haxxor',
                fullName = '<script>alert("I am so clever")</script>',
                response = {};
            response[userId] = fullName;

            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list=haxxor/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(response)
            });
            DisplayUtil.displayRealName(userId, $nameTarget)
                .then(() => {
                    expect($nameTarget.html()).toContain(userId);
                    expect($nameTarget.html()).toContain($('<div>').text(fullName).html());
                    expect($nameTarget.html()).toContain(' (<a href="' + profilePageUrl + userId + '" target="_blank">' + userId + '</a>)');
                    done();
                });
        });

        it('displayRealName should skip displaying full name when not available', (done) => {
            let userId = 'fake',
                fullName = 'not present',
                response = {};

            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list=fake/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify({})
            });
            DisplayUtil.displayRealName(userId, $nameTarget)
                .then(() => {
                    expect($nameTarget.html()).toEqual('<a href="' + profilePageUrl + userId + '" target="_blank">' + userId + '</a>');
                    done();
                });
        });

        it('displayRealName should display just the username if the auth call fails', (done) => {
            let userId = 'fake';
            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list=fake/).andReturn({
                status: 500,
                statusText: 'fail',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify({})
            });
            DisplayUtil.displayRealName(userId, $nameTarget)
                .finally(() => {
                    expect($nameTarget.html()).toEqual('<a href="' + profilePageUrl + userId + '" target="_blank">' + userId + '</a>');
                    done();
                });
        });

        it('displayRealName should deal with hackery usernames as well', (done) => {
            let userId = '<script>alert("Bad actor")</script>',
                fullName = "Really Bad Actor",
                response = {};
            response[StringUtil.escape(userId)] = fullName;
            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(response)
            });
            DisplayUtil.displayRealName(userId, $nameTarget)
                .finally(() => {
                    let escapedId = StringUtil.escape(userId);
                    expect($nameTarget.html()).toContain(escapedId);
                    expect($nameTarget.html()).toContain(StringUtil.escape(fullName));
                    let idWithQuotes = '&lt;script&gt;alert("Bad actor")&lt;/script&gt;';
                    expect($nameTarget.html()).toContain(' (<a href="' + profilePageUrl + escapedId + '" target="_blank">' + idWithQuotes + '</a>)');
                    done();
                });
        });

        it('getAppIcon() should create a default icons for methods and apps', function() {
            var $icon = DisplayUtil.getAppIcon({});
            expect($icon.html()).toContain('method-icon');
            expect($icon.html()).not.toContain('app-icon');

            var $icon = DisplayUtil.getAppIcon({isApp:true});
            expect($icon.html()).toContain('app-icon');
            expect($icon.html()).not.toContain('method-icon');
        });

        it('getAppIcon() should create a default icons with urls', function() {
            var $icon = DisplayUtil.getAppIcon({url:'https://kbase.us/someimg.png'});
            // right now icon is directly an image, but might not always be the case, so
            // test that we can find the url
            expect($('<div>').append($icon).html()).toContain('https://kbase.us/someimg.png');
            expect($('<div>').append($icon).html()).not.toContain('method-icon');
            expect($('<div>').append($icon).html()).toContain('default');
            expect($('<div>').append($icon).html()).not.toContain('app-icon');
        });

        it('getAppIcon() should use the cursor option', function() {
            var $icon = DisplayUtil.getAppIcon({url:'https://kbase.us/someimg.png', cursor:'pointer'});
            expect($('<div>').append($icon).html()).toContain('https://kbase.us/someimg.png');
            expect($('<div>').append($icon).html()).toContain('pointer');
            expect($('<div>').append($icon).html()).not.toContain('method-icon');
            expect($('<div>').append($icon).html()).not.toContain('app-icon');

            $icon = DisplayUtil.getAppIcon({cursor:'pointer'});
            expect($('<div>').append($icon).html()).toContain('pointer');
            expect($('<div>').append($icon).html()).toContain('method-icon');
            expect($('<div>').append($icon).html()).not.toContain('app-icon');
        });

    });
});