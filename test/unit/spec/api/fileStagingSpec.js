/*global define*/
/*global describe, it, expect fail*/
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
        beforeEach(function() {
            if (TestUtil.getAuthToken()) {
                fileStaging = new FileStaging(Config.url('ftp_api_url'), TestUtil.getUserId(), {token: TestUtil.getAuthToken()});
            }
        });

        it('Should be a valid client.', function() {
            TestUtil.pendingIfNoToken();
            expect(fileStaging).toEqual(jasmine.any(Object));
        });

        it('Should throw an error with a missing URL', function() {
            TestUtil.pendingIfNoToken();
            try {
                new FileStaging(null, TestUtil.getUserId(), {token: TestUtil.getAuthToken()});
            }
            catch (error) {
                expect(error).not.toBeNull();
            }
        });

        it('Should throw an error with a missing user name', function() {
            TestUtil.pendingIfNoToken();
            try {
                new FileStaging(Config.url('ftp_api_url'), null, {token: TestUtil.getAuthToken()});
            }
            catch (error) {
                expect(error).not.toBeNull();
            }
        });

        it('Should throw an error with a missing auth token', function() {
            TestUtil.pendingIfNoToken();
            try {
                new FileStaging(Config.url('ftp_api_url'), TestUtil.getUserId(), null);
            }
            catch (error) {
                expect(error).not.toBeNull();
            }
        });

        it('Should retrieve a list of files', function(done) {
            TestUtil.pendingIfNoToken();
            fileStaging.list(null, {userId: true})
                .then(function(files) {
                    files.forEach(function(file) {
                        expect(file.name).not.toBeNull();
                    });
                })
                .catch(function(error) {
                    fail(JSON.stringify(error));
                })
                .finally(function() {
                    done();
                });
        });

        it('Should raise an error with a bad subpath', function(done) {
            pending('waiting on backend fix');
            TestUtil.pendingIfNoToken();
            fileStaging.list('not_a_path')
                .then(function(files) {
                    if (files !== undefined) {
                        expect(files.length).toBe(0);
                    }
                    else {
                        expect(files).toBe(undefined);
                    }
                })
                .catch(function(error) {
                    fail('Call threw an error');
                })
                .finally(function() {
                    done();
                });
        });

        it('Should upload a file', function() {
            TestUtil.pendingIfNoToken();
            //TODO
        });

        xit('Should search for files', function(done) {
            TestUtil.pendingIfNoToken();
            fileStaging.search('.txt')
                .then(function(files) {
                    files.forEach(function(file) {
                        expect(file.path).not.toBeNull();
                    });
                })
                .catch(function(error) {
                    fail(error);
                })
                .finally(function() {
                    done();
                });
        });

        xit('Should return an empty list for a null search results', function(done) {
            TestUtil.pendingIfNoToken();
            fileStaging.search('i am a long search that will not happen')
                .then(function(files) {
                    expect(files.length).toBe(0);
                })
                .catch(function(error) {
                    fail(error);
                })
                .finally(function() {
                    done();
                });
        });

        it('Should retrieve file status', function() {
            TestUtil.pendingIfNoToken();
            //TODO
        });

        it('Should return null for an empty file status', function() {
            TestUtil.pendingIfNoToken();
            //TODO
        });

    });
});
