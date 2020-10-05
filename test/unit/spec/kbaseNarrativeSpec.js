/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach, beforeAll*/
/*jslint white: true*/

define ([
    'narrativeConfig',
    'kbaseNarrative',
    'base/js/namespace'
], (
    Config,
    Narrative,
    Jupyter
) => {
    'use strict';

    const DEFAULT_FULLY_LOADED = false,
        DEFAULT_WRITABLE = false,
        DEFAULT_NOTEBOOK_NAME = 'some notebook';

    describe('Test the kbaseNarrative module', () => {
        beforeAll(() => {
            // mock a jupyter notebook.
            // namespace should already be loaded
            Jupyter.notebook = {
                _fully_loaded: DEFAULT_FULLY_LOADED,
                writable: DEFAULT_WRITABLE,
                keyboard_manager: {
                    edit_shortcuts: {
                        remove_shortcut: () => {}
                    },
                    command_shortcuts: {
                        remove_shortcut: () => {}
                    }
                },
                kernel: {
                    is_connected: () => false
                },
                notebook_name: DEFAULT_NOTEBOOK_NAME
            };
        });

        beforeEach(() => {
            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('Should instantiate', () => {
            const narr = new Narrative();
            expect(narr.maxNarrativeSize).toBe('10 MB');
        });

        it('Should have an init function', () => {
            const narr = new Narrative();
            narr.init();
        });

        it('Should return for is_loaded', () => {
            const narr = new Narrative();
            expect(narr.isLoaded()).toEqual(DEFAULT_FULLY_LOADED);  // default as set in
        });

        it('Should test ui mode', () => {
            const narr = new Narrative();
            expect(narr.uiModeIs('edit')).toBe(DEFAULT_WRITABLE);
            expect(narr.uiModeIs('view')).toBe(!DEFAULT_WRITABLE);
            Jupyter.notebook.writable = !Jupyter.notebook.writable;
            expect(narr.uiModeIs('edit')).toBe(!DEFAULT_WRITABLE);
            expect(narr.uiModeIs('view')).toBe(DEFAULT_WRITABLE);
        });

        it('Should provide an auth token when requested', () => {
            jasmine.Ajax.stubRequest('/token').andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                response: JSON.stringify({

                })
            });
            jasmine.Ajax.stubRequest('/me').andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                response: JSON.stringify({

                })
            });
            document.cookie='kbase_session=foo';
            const narr = new Narrative();
            expect(narr.getAuthToken()).toBe('foo');
        });


    });
});
