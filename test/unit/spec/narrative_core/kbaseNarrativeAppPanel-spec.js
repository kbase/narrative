define([
    'jquery',
    'kbaseNarrativeAppPanel',
    'base/js/namespace',
    'narrativeConfig',
    'narrativeMocks',
], ($, AppPanel, Jupyter, Config, Mocks) => {
    'use strict';
    let $panel, appPanel;
    const FAKE_USER = 'some_user',
        FAKE_TOKEN = 'some_fake_token',
        NS_URL = 'https://kbase.us/service/fakeNSUrl',
        CATEGORY_A = 'categorya',
        CATEGORY_B = 'categoryb',
        // a map of ignored categories returned from NarrativeService.get_ignored_categories
        // maps from category name -> 1 (if ignored)
        IGNORED_CATEGORIES = {
            inactive: 1,
        },
        APP_INFO = {
            module_versions: {
                a_module: '0.1',
                another_module: '0.2',
            },
            app_infos: {
                'a_module/an_app': {
                    info: {
                        id: 'a_module/an_app',
                        module_name: 'a_module',
                        git_commit_hash: 'blahblahhash',
                        name: 'Run An App from A Module',
                        ver: '1.0.0',
                        subtitle: 'Run an app',
                        tooltip: 'Run an app',
                        icon: {
                            url: 'img?method_id=a_module/an_app&image_name=an_app.png&tag=release',
                        },
                        categories: ['active', CATEGORY_A],
                        authors: [FAKE_USER],
                        input_types: ['Module1.Type1', 'Module2.Type2'],
                        output_types: ['ModuleOut.TypeOut'],
                        app_type: 'app',
                        namespace: 'a_module',
                        short_input_types: ['Type1', 'Type2'],
                        short_output_types: ['TypeOut'],
                    },
                },
                'another_module/another_app': {
                    info: {
                        id: 'another_module/another_app',
                        module_name: 'another_module',
                        git_commit_hash: 'blahblahhash',
                        name: 'Run An App from A Module',
                        ver: '1.0.0',
                        subtitle: 'Run an app',
                        tooltip: 'Run an app',
                        icon: {
                            url:
                                'img?method_id=another_module/another_app&image_name=an_app.png&tag=release',
                        },
                        categories: ['active', CATEGORY_B],
                        authors: [FAKE_USER],
                        input_types: ['Module1.Type1'],
                        output_types: ['ModuleOut.TypeOut'],
                        app_type: 'app',
                        namespace: 'another_module',
                        short_input_types: ['Type1'],
                        short_output_types: ['TypeOut'],
                    },
                    favorite: 1612814706712,
                },
            },
        };

    describe('The kbaseNarrativeAppPanel widget', () => {
        beforeEach(() => {
            Jupyter.narrative = {
                getAuthToken: () => FAKE_TOKEN,
                userId: FAKE_USER,
                narrController: {
                    uiModeIs: () => false,
                },
            };

            // just a dummy mock so we don't see error messages. Don't actually need a kernel.
            Jupyter.notebook = {
                kernel: {
                    execute: () => {},
                },
            };

            jasmine.Ajax.install();
            Mocks.mockServiceWizardLookup({
                module: 'NarrativeService',
                url: NS_URL,
            });
            Mocks.mockJsonRpc1Call({
                url: NS_URL,
                body: /get_all_app_info/,
                response: APP_INFO,
            });
            Mocks.mockJsonRpc1Call({
                url: NS_URL,
                body: /get_ignore_categories/,
                response: IGNORED_CATEGORIES,
            });

            $panel = $('<div>');
            appPanel = new AppPanel($panel);
            return appPanel.refreshFromService();
        });

        afterEach(() => {
            appPanel.detach();
            $panel = $('<div>');
            appPanel = null;
            Jupyter.notebook = null;
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
        });

        it('Should initialize properly', () => {
            expect(appPanel).toBeDefined();
        });

        it('Should have a working search interface', () => {
            // search bar should start invisible
            expect(appPanel.$methodList.children().children().length).not.toBe(0);

            appPanel.bsSearch.val('should show nothing');
            appPanel.refreshPanel();
            expect(appPanel.$methodList.children().children().length).toBe(0);

            appPanel.bsSearch.val('Type1');
            appPanel.refreshPanel();
            // should have favorites, categoryA, categoryB
            expect(appPanel.$methodList.children().children().length).toBe(3);

            appPanel.bsSearch.val('Type2');
            appPanel.refreshPanel();
            // should have favorites and categoryA
            expect(appPanel.$methodList.children().children().length).toBe(1);
        });

        it('Should trigger search by jquery event filterMethods.Narrative', () => {
            expect(appPanel.$methodList.children().children().length).toBe(3);

            $(document).trigger('filterMethods.Narrative', 'should show nothing');
            expect(appPanel.$methodList.children().children().length).toBe(0);
        });

        it('Should reset search by jquery event removeFilterMethods.Narrative', () => {
            expect(appPanel.$methodList.children().children().length).toBe(3);

            $(document).trigger('filterMethods.Narrative', 'should show nothing');
            expect(appPanel.$methodList.children().children().length).toBe(0);
            $(document).trigger('removeFilterMethods.Narrative');
            expect(appPanel.$methodList.children().children().length).toBe(3);
        });

        it('Should toggle search bar visibility by hitting a button', () => {
            expect(appPanel.$searchDiv.is(':visible')).toBeFalsy();
            // use the app_offset flag as a proxy for having clicked.
            expect(appPanel.app_offset).toBeTrue();
            $panel.find('button.btn .fa-search').parent().click();
            expect(appPanel.app_offset).toBeFalse();
            $panel.find('button.btn .fa-search').parent().click();
            expect(appPanel.app_offset).toBeTrue();
        });

        it('Should have a working filter menu', () => {
            // Should have a filter menu.
            const dropdownSelector = '#kb-app-panel-filter';
            expect($panel.find(dropdownSelector).length).not.toBe(0);
            // should have category, input types, output types, name a-z, name z-a
            const filterList = ['category', 'input types', 'output types', 'name a-z', 'name z-a'];
            $panel
                .find(dropdownSelector)
                .parent()
                .find('.dropdown-menu li')
                .each((idx, item) => {
                    expect($(item).text().toLowerCase()).toEqual(filterList[idx]);
                });
            // should default to category
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('category');
            const appListSel = '.kb-function-body > div:last-child > div > div';
            // spot check category list.
            let categoryList = $panel
                .find(appListSel + '> div.row')
                .toArray()
                .map((elem) => {
                    const str = elem.innerText.toLowerCase();
                    return str.substring(0, str.lastIndexOf(' '));
                });
            // no "my favorites" because we're not logged in
            expect(categoryList.indexOf(CATEGORY_A)).not.toBe(-1);
            expect(categoryList.indexOf(CATEGORY_B)).not.toBe(-1);

            // click input types
            $panel.find(dropdownSelector).parent().find('.dropdown-menu li:nth-child(2) a').click();
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('input');
            categoryList = $panel
                .find(appListSel + '> div.row')
                .toArray()
                .map((elem) => {
                    const str = elem.innerText.toLowerCase();
                    return str.substring(0, str.lastIndexOf(' '));
                });
            expect(categoryList.indexOf('type1')).not.toBe(-1);
            expect(categoryList.indexOf('type2')).not.toBe(-1);

            // click output types
            $panel.find(dropdownSelector).parent().find('.dropdown-menu li:nth-child(3) a').click();
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('output');
            categoryList = $panel
                .find(appListSel + '> div.row')
                .toArray()
                .map((elem) => {
                    const str = elem.innerText.toLowerCase();
                    return str.substring(0, str.lastIndexOf(' '));
                });
            expect(categoryList.indexOf('typeout')).not.toBe(-1);
            expect(categoryList.indexOf('type1')).toBe(-1);
            expect(categoryList.indexOf('type2')).toBe(-1);

            // click name a-z
            // show alphabetical names of apps
            $panel.find(dropdownSelector).parent().find('.dropdown-menu li:nth-child(4) a').click();
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('a-z');
            let appList = $panel
                .find(appListSel + ' div.kb-data-list-name')
                .toArray()
                .map((item) => {
                    return item.innerText.toLowerCase();
                });
            // sort it, then compare to see if in same order. remember, we don't have favorites that pop to the top.
            expect(appList.sort().join('')).toEqual(appList.join(''));

            // click name z-a
            $panel.find(dropdownSelector).parent().find('.dropdown-menu li:nth-child(5) a').click();
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('z-a');
            appList = $panel
                .find(appListSel + ' div.kb-data-list-name')
                .toArray()
                .map((item) => {
                    return item.innerText.toLowerCase();
                });
            // sort it, then compare to see if in same order. remember, we don't have favorites that pop to the top.
            expect(appList.sort().reverse().join('')).toEqual(appList.join(''));
        });

        it('Should have a working version toggle button', () => {
            appPanel.$toggleVersionBtn.tooltip = () => {}; // to stop any jquery/bootstrap nonsense that happens in testing.
            const toggleBtn = $panel.find('.btn-toolbar button:nth-child(4)');
            expect(toggleBtn.length).toBe(1);
            spyOn(appPanel, 'refreshFromService');
            expect(toggleBtn.text()).toEqual('R');
            toggleBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('beta');
            expect(toggleBtn.text()).toEqual('B');
            toggleBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('dev');
            expect(toggleBtn.text()).toEqual('D');
            toggleBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('release');
            expect(toggleBtn.text()).toEqual('R');
        });

        it('Should have a working refresh button', () => {
            const refreshBtn = $panel.find('.btn-toolbar button:nth-child(3)');
            spyOn(appPanel, 'refreshFromService');
            refreshBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalled();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('release');
            const toggleBtn = $panel.find('.btn-toolbar button:nth-child(4)');
            appPanel.$toggleVersionBtn.tooltip = () => {}; // to stop any jquery/bootstrap nonsense that happens in testing.
            toggleBtn.click();
            refreshBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('beta');
            toggleBtn.click();
            refreshBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('dev');
        });

        it('Should respond to getFunctionSpecs.Narrative by returning a set of app specs', (done) => {
            const lookupId = 'a_module/an_app',
                dummySpec = {
                    info: {
                        id: lookupId,
                    },
                };
            Mocks.mockJsonRpc1Call({
                url: Config.url('narrative_method_store'),
                response: [dummySpec],
            });

            const cb = (specs) => {
                expect(specs).toBeDefined();
                expect(specs.methods[lookupId]).toEqual(dummySpec);
                done();
            };
            const appRequest = {
                methods: [lookupId],
            };
            $(document).trigger('getFunctionSpecs.Narrative', [appRequest, cb]);
        });

        it('Should return empty results when a spec cannot be found', (done) => {
            const cb = (specs) => {
                expect(specs).toBeDefined();
                expect(specs.methods).toEqual({});
                done();
            };
            const appRequest = {
                methods: ['notAModule/notAnApp'],
            };
            Mocks.mockJsonRpc1Call({
                url: Config.url('narrative_method_store'),
                response: { error: "repository notAModule wasn't registered" },
                statusCode: 500,
            });
            $(document).trigger('getFunctionSpecs.Narrative', [appRequest, cb]);
        });

        it('Should return an empty list when requesting empty methods', (done) => {
            const cb = (specs) => {
                expect(specs).toEqual({});
                done();
            };
            $(document).trigger('getFunctionSpecs.Narrative', [{}, cb]);
        });

        it('Should have a working catalog slideout button', () => {
            // spoof being logged in from the catalog widget's point of view

            $(document).on('loggedInQuery.kbase', (e, cb) => {
                if (cb) {
                    cb({
                        token: FAKE_TOKEN,
                        user_id: FAKE_USER,
                        kbase_sessionid: 'fake_session',
                    });
                }
            });

            spyOn(appPanel, 'spawnCatalogBrowser');
            $panel.find('button.btn .fa-arrow-right').click();
            expect(appPanel.spawnCatalogBrowser).toHaveBeenCalled();
            $(document).off('loggedInQuery.kbase');
        });

        it('Should collapse/restore on read only toggling', () => {
            spyOn(appPanel, 'toggleCollapse');
            appPanel.setReadOnlyMode(true);
            expect(appPanel.toggleCollapse).toHaveBeenCalledWith('collapse');
            appPanel.setReadOnlyMode(false);
            expect(appPanel.toggleCollapse).toHaveBeenCalledWith('restore');
        });

        it('Should know how to set its list height', (done) => {
            appPanel.setListHeight('100px', false);
            expect(appPanel.$methodList.css('height')).toEqual('100px');
            appPanel.setListHeight('123px', true);
            setTimeout(() => {
                expect(appPanel.$methodList.css('height')).toEqual('123px');
                done();
            }, 1000);
        });

        it('Should trigger the insert app function when triggerApp is called', (done) => {
            const appId = 'a_module/an_app',
                dummySpec = {
                    info: {
                        id: appId,
                    },
                },
                appTag = 'release';
            Mocks.mockJsonRpc1Call({
                url: Config.url('narrative_method_store'),
                response: [dummySpec],
            });
            // in actual usage, this event gets bound to either $(document) or some other
            // widget that it percolates up to. Jasmine doesn't like that, so we bind it here
            appPanel.on('appClicked.Narrative', (event, app, tag, params) => {
                expect(app).toEqual(dummySpec);
                expect(tag).toEqual(appTag);
                expect(params).not.toBeDefined();
                done();
            });
            appPanel.triggerApp(appId, 'release');
        });

        it('Should trigger the insert app function when an app card has its title clicked', (done) => {
            const appId = 'a_module/an_app',
                appName = APP_INFO.app_infos[appId].info.name,
                dummySpec = {
                    info: {
                        id: appId,
                        name: appName,
                    },
                },
                appTag = 'release';
            Mocks.mockJsonRpc1Call({
                url: Config.url('narrative_method_store'),
                response: [dummySpec],
            });
            // in actual usage, this event gets bound to either $(document) or some other
            // widget that it percolates up to. Jasmine doesn't like that, so we bind it here
            appPanel.on('appClicked.Narrative', (event, app, tag, params) => {
                expect(app).toEqual(dummySpec);
                expect(tag).toEqual(appTag);
                expect(params).not.toBeDefined();
                done();
            });
            $panel.find(`div.kb-data-list-name:contains("${appName}")`).click();
        });

        it('Should know how to show an error', () => {
            const title = 'Error Title',
                error = 'Error string';
            appPanel.showError(title, error);
            expect(appPanel.$errorPanel.html()).toContain(title);
            expect(appPanel.$errorPanel.html()).toContain(error);
        });
    });
});
