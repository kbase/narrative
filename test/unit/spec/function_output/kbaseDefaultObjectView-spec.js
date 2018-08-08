/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'widgets/function_output/kbaseDefaultObjectView',
    'testUtil',
    'common/runtime',
    'base/js/namespace',
    'kbaseNarrative'
], (
    $,
    KBaseDefaultObjectView,
    TestUtil,
    Runtime,
    Jupyter,
    Narrative
) => {
    'use strict';
    describe('Test the kbaseDefaultObjectView widget', () => {
        let $div = null;
        beforeEach(() => {
            jasmine.Ajax.install();
            $div = $('<div>');
            if (TestUtil.getAuthToken()) {
                Jupyter.narrative = new Narrative();
                Jupyter.narrative.getAuthToken = () => { return TestUtil.getAuthToken(); };
            }
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $div.remove();
        });

        it('Should load properly when no upas given', (done) => {
            TestUtil.pendingIfNoToken();
            let w = new KBaseDefaultObjectView($div);
            w.render()
                .then(() => {
                    expect($div.html()).toContain('No objects to display!');
                    done();
                });
        });

        it('Should load properly when not logged in', () => {

        });

        it('Should properly load with a valid upa', () => {

        });
    });
});
