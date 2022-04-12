define(['jquery', 'util/display', 'narrativeConfig', 'util/string'], (
    $,
    DisplayUtil,
    Config,
    StringUtil
) => {
    'use strict';

    describe('KBase Display Utility function module', () => {
        let $nameTarget;
        const profilePageUrl = Config.url('profile_page');

        beforeEach(() => {
            $nameTarget = $('<div>');
            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $nameTarget.remove();
        });

        it('displayRealName should display a real name with link to user page', (done) => {
            const userId = 'testuser',
                fullName = 'Test User',
                response = {};
            response[userId] = fullName;
            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list=testuser/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(response),
            });
            DisplayUtil.displayRealName(userId, $nameTarget).then(() => {
                expect($nameTarget.html()).toContain(userId);
                expect($nameTarget.html()).toContain(fullName);
                expect($nameTarget.html()).toContain(
                    '(<a href="' + profilePageUrl + userId + '" target="_blank">' + userId + '</a>)'
                );
                done();
            });
        });

        it('displayRealName should display whatever text name it gets back', (done) => {
            const userId = 'haxxor',
                fullName = '<script>alert("I am so clever")</script>',
                response = {};
            response[userId] = fullName;

            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list=haxxor/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(response),
            });
            DisplayUtil.displayRealName(userId, $nameTarget).then(() => {
                expect($nameTarget.html()).toContain(userId);
                expect($nameTarget.html()).toContain($('<div>').text(fullName).html());
                expect($nameTarget.html()).toContain(
                    ' (<a href="' +
                        profilePageUrl +
                        userId +
                        '" target="_blank">' +
                        userId +
                        '</a>)'
                );
                done();
            });
        });

        it('displayRealName should skip displaying full name when not available', (done) => {
            const userId = 'fake';

            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list=fake/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify({}),
            });
            DisplayUtil.displayRealName(userId, $nameTarget).then(() => {
                expect($nameTarget.html()).toEqual(
                    '<a href="' + profilePageUrl + userId + '" target="_blank">' + userId + '</a>'
                );
                done();
            });
        });

        it('displayRealName should display just the username if the auth call fails', (done) => {
            const userId = 'fake';

            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list=fake/).andReturn({
                status: 500,
                statusText: 'fail',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify({}),
            });
            DisplayUtil.displayRealName(userId, $nameTarget).finally(() => {
                expect($nameTarget.html()).toEqual(
                    '<a href="' + profilePageUrl + userId + '" target="_blank">' + userId + '</a>'
                );
                done();
            });
        });

        it('displayRealName should deal with hackery usernames', (done) => {
            const userId = "<script>alert('Bad actor')</script>",
                fullName = 'Really Bad Actor',
                response = {};
            response[StringUtil.escape(userId)] = fullName;
            jasmine.Ajax.stubRequest(/.*\/auth\/api\/V2\/users\/\?list/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(response),
            });
            DisplayUtil.displayRealName(userId, $nameTarget).finally(() => {
                const properId = $('<div>').text(userId).html();
                expect($nameTarget[0].innerHTML).toContain(fullName);
                expect($nameTarget[0].innerHTML).toContain(properId);
                expect($nameTarget[0].innerHTML).toContain(
                    ' (<a href="' +
                        profilePageUrl +
                        userId +
                        '" target="_blank">' +
                        properId +
                        '</a>)'
                );
                done();
            });
        });
    });
});
