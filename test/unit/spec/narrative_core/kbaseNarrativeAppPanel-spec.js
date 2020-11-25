/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach, spyOn*/
/*jslint white: true*/
define([
    'jquery',
    'jquery-ui',
    'kbaseNarrativeAppPanel',
    'base/js/namespace',
    'kbaseNarrative',
    'bootstrap',
], function ($, jqueryui, AppPanel, Jupyter, Narrative) {
    'use strict';
    var $panel = $('<div>');
    var appPanel = null;

    describe('Test the kbaseNarrativeAppPanel widget', function () {
        beforeEach(function (done) {
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.userId = 'narrativetest';
            Jupyter.narrative.narrController = {
                uiModeIs: (p) => false,
            };
            // just a dummy mock so we don't see error messages. Don't actually need a kernel.
            Jupyter.notebook = {
                kernel: {
                    execute: function (inputs) {},
                },
            };
            appPanel = new AppPanel($panel);
            appPanel.refreshFromService().then(function () {
                done();
            });
        });
        afterEach(function () {
            appPanel.detach();
            $panel = $('<div>');
            appPanel = null;
        });

        it('Should initialize properly', function () {
            expect(appPanel).toEqual(jasmine.any(Object));
        });

        it('Should have a working search interface', function () {
            // search bar should start invisible
            expect(appPanel.$methodList.children().children().length).not.toBe(0);

            appPanel.bsSearch.val('should show nothing');
            appPanel.refreshPanel();
            expect(appPanel.$methodList.children().children().length).toBe(0);

            appPanel.bsSearch.val('genome');
            appPanel.refreshPanel();
            expect(appPanel.$methodList.children().children().length).not.toBe(0);

            //TODO:
            // verify by setting output:genome and making sure there's only one output category
        });

        it('Should trigger search by jquery event filterMethods.Narrative', function () {
            expect(appPanel.$methodList.children().children().length).not.toBe(0);

            $(document).trigger('filterMethods.Narrative', 'should show nothing');
            expect(appPanel.$methodList.children().children().length).toBe(0);
        });

        it('Should reset search by jquery event removeFilterMethods.Narrative', () => {
            expect(appPanel.$methodList.children().children().length).not.toBe(0);

            $(document).trigger('filterMethods.Narrative', 'should show nothing');
            expect(appPanel.$methodList.children().children().length).toBe(0);
            $(document).trigger('removeFilterMethods.Narrative');
            expect(appPanel.$methodList.children().children().length).not.toBe(0);
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

        it('Should have a working filter menu', function () {
            // Should have a filter menu.
            var dropdownSelector = '#kb-app-panel-filter';
            expect($panel.find(dropdownSelector).length).not.toBe(0);
            // should have category, input types, output types, name a-z, name z-a
            var filterList = ['category', 'input types', 'output types', 'name a-z', 'name z-a'];
            $panel
                .find(dropdownSelector)
                .parent()
                .find('.dropdown-menu li')
                .each(function (idx, item) {
                    expect($(item).text().toLowerCase()).toEqual(filterList[idx]);
                });
            // should default to category
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('category');
            var appListSel = '.kb-function-body > div:last-child > div > div';
            // spot check category list.
            var categoryList = $panel
                .find(appListSel + '> div.row')
                .toArray()
                .map(function (elem) {
                    var str = elem.innerText.toLowerCase();
                    return str.substring(0, str.lastIndexOf(' '));
                });
            // no "my favorites" because we're not logged in
            expect(categoryList.indexOf('comparative genomics')).not.toBe(-1);
            expect(categoryList.indexOf('expression')).not.toBe(-1);
            expect(categoryList.indexOf('genome annotation')).not.toBe(-1);

            // click input types
            $panel.find(dropdownSelector).parent().find('.dropdown-menu li:nth-child(2) a').click();
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('input');
            categoryList = $panel
                .find(appListSel + '> div.row')
                .toArray()
                .map(function (elem) {
                    var str = elem.innerText.toLowerCase();
                    return str.substring(0, str.lastIndexOf(' '));
                });
            expect(categoryList.indexOf('assembly')).not.toBe(-1);
            expect(categoryList.indexOf('fba')).not.toBe(-1);
            expect(categoryList.indexOf('fbamodel')).not.toBe(-1);

            // click output types
            $panel.find(dropdownSelector).parent().find('.dropdown-menu li:nth-child(3) a').click();
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('output');
            categoryList = $panel
                .find(appListSel + '> div.row')
                .toArray()
                .map(function (elem) {
                    var str = elem.innerText.toLowerCase();
                    return str.substring(0, str.lastIndexOf(' '));
                });
            expect(categoryList.indexOf('assemblyset')).not.toBe(-1);
            expect(categoryList.indexOf('fbacomparison')).not.toBe(-1);
            expect(categoryList.indexOf('pangenome')).not.toBe(-1);

            // click name a-z
            // show alphabetical names of apps
            $panel.find(dropdownSelector).parent().find('.dropdown-menu li:nth-child(4) a').click();
            expect(
                $panel.find(dropdownSelector).find('span:first-child').text().toLowerCase()
            ).toEqual('a-z');
            var appList = $panel
                .find(appListSel + ' div.kb-data-list-name')
                .toArray()
                .map(function (item) {
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
                .map(function (item) {
                    return item.innerText.toLowerCase();
                });
            // sort it, then compare to see if in same order. remember, we don't have favorites that pop to the top.
            expect(appList.sort().reverse().join('')).toEqual(appList.join(''));
        });

        it('Should have a working version toggle button', function () {
            // TODO: Should probably inject some NarrativeTest apps in CI where this will be test.
            appPanel.$toggleVersionBtn.tooltip = function () {}; // to stop any jquery/bootstrap nonsense that happens in testing.
            var toggleBtn = $panel.find('.btn-toolbar button:nth-child(4)');
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

        it('Should have a working refresh button', function () {
            var refreshBtn = $panel.find('.btn-toolbar button:nth-child(3)');
            spyOn(appPanel, 'refreshFromService');
            refreshBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalled();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('release');
            var toggleBtn = $panel.find('.btn-toolbar button:nth-child(4)');
            appPanel.$toggleVersionBtn.tooltip = function () {}; // to stop any jquery/bootstrap nonsense that happens in testing.
            toggleBtn.click();
            refreshBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('beta');
            toggleBtn.click();
            refreshBtn.click();
            expect(appPanel.refreshFromService).toHaveBeenCalledWith('dev');
        });

        it('Should respond to getFunctionSpecs.Narrative by returning a set of app specs', (done) => {
            const cb = (specs) => {
                expect(specs).toBeDefined();
                expect(specs.methods['kb_quast/run_QUAST_app']).toEqual(jasmine.any(Object));
                done();
            };
            const appRequest = {
                methods: ['kb_quast/run_QUAST_app'],
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
            $(document).trigger('getFunctionSpecs.Narrative', [appRequest, cb]);
        });

        it('Should return an empty list when requesting empty methods', (done) => {
            const cb = (specs) => {
                console.log(specs);
                expect(specs).toEqual({});
                done();
            };
            $(document).trigger('getFunctionSpecs.Narrative', [{}, cb]);
        });

        it('Should have a working catalog slideout button', function () {
            // spoof being logged in from the catalog widget's point of view

            $(document).on('loggedInQuery.kbase', (e, cb) => {
                if (cb) {
                    cb({
                        token: 'fake_token',
                        user_id: 'narrativetest',
                        kbase_sessionid: 'narrativetest_session',
                    });
                }
            });

            expect(appPanel.appCatalog).toBeNull();
            $panel.find('button.btn .fa-arrow-right').click();
            expect(appPanel.appCatalog).not.toBeNull();

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
            // appPanel.setListHeight('10px', true);
            // expect(appPanel.$methodList.css('height')).toEqual('10px');
            appPanel.setListHeight('100px', false);
            expect(appPanel.$methodList.css('height')).toEqual('100px');
            appPanel.setListHeight('123px', true);
            setTimeout(() => {
                expect(appPanel.$methodList.css('height')).toEqual('123px');
                done();
            }, 1000);
        });

        xit('Should trigger the insert app function when clicking on an app', (done) => {
            $(document).on('appClicked.Narrative', (app, tag, params) => {
                console.log(app);
                console.log(tag);
                console.log(params);
                done();
            });
            appPanel.triggerApp('megahit/run_megahit', 'release');
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
