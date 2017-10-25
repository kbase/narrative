/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'api/fileStaging',
    'narrativeConfig',
    'testUtil'
], function(
    FileStaging,
    Config,
    TestUtil
) {
    'use strict';
    describe('Test the File Staging API wrapper', function() {
        var fileStaging;

        it('Should do the things.', function() {
            TestUtil.pendingIfNoToken();
            expect(1).toBe(0);
        });
    });
});
