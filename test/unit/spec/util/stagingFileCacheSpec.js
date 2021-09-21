define(['util/stagingFileCache', 'narrativeConfig', 'base/js/namespace', 'testUtil'], (StagingFileCache, Config, Jupyter, TestUtil) => {
    'use strict';

    describe('staging file cache tests', () => {
        const stagingUrl = Config.url('staging_api_url');
        const fakeStagingResponse = ['file1', 'file2', 'file3'].map((fileName) => {
            return {
                name: fileName,
                path: 'someUser' + '/' + fileName,
                mtime: 1532738637499,
                size: 34,
                isFolder: false,
            };
        });

        beforeEach(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeAuthToken'
            };
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(new RegExp(`${stagingUrl}/list/`)).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(fakeStagingResponse),
            });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
            StagingFileCache.clearCache();
        });

        it('should have the expected functions', () => {
            ['getFileList', 'clearCache'].forEach((fn) => {
                expect(StagingFileCache[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should load staging area files as expected', async () => {
            const fileListResult = await StagingFileCache.getFileList();
            const fileList = JSON.parse(fileListResult);

            expect(fileList.length).toBe(3);
            const files = fileList.map((fileInfo) => {
                expect(fileInfo.size).toBe(34);
                expect(fileInfo.isFolder).toBeFalse();
                expect(fileInfo.mtime).toBe(1532738637499);
                expect(fileInfo.path).toContain('someUser/');
                return fileInfo.name;
            });
            expect(files).toEqual(['file1', 'file2', 'file3']);
        });

        it('should load the same Promise with staging files if run multiple consecutive times', () => {
            const fileListPromise = StagingFileCache.getFileList();
            expect(fileListPromise).toBe(StagingFileCache.getFileList());
        });

        it('should make a new run when forced', () => {
            const fileListPromise = StagingFileCache.getFileList();
            expect(fileListPromise).not.toBe(StagingFileCache.getFileList(true));
        });

        it('should clear the cache after a timeout period', async () => {
            jasmine.clock().install();
            const fileListResult = await StagingFileCache.getFileList();
            const fileList = JSON.parse(fileListResult);

            expect(fileList.length).toBe(3);  // assume the response is the same as the other test, as long as there's 3 files
            const fakeStagingResponse2 = ['fileX', 'fileY'].map((fileName) => {
                return {
                    name: fileName,
                    path: 'someUser' + '/' + fileName,
                    mtime: 1678901234567,
                    size: 45,
                    isFolder: false,
                };
            });
            jasmine.Ajax.stubRequest(new RegExp(`${stagingUrl}/list/`)).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(fakeStagingResponse2),
            });

            // continue to expect that the new call returns the same Promise, though we've set up a new AJAX mock
            const duplicateCall = await StagingFileCache.getFileList();
            expect(fileListResult).toEqual(duplicateCall);

            jasmine.clock().mockDate(new Date(Date.now() + StagingFileCache.REFRESH_INTERVAL + 100));

            const newFileResult = await StagingFileCache.getFileList();
            expect(newFileResult).not.toEqual(fileListResult);
            const newFileList = JSON.parse(newFileResult);
            expect(newFileList.length).toBe(2);

            jasmine.clock().uninstall();
        });
    });
});
