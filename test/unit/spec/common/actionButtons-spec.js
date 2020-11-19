/*global describe, it, expect*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'common/commonCell/actionButtons',
    'jquery',
    'common/runtime',
    'common/ui',
    'common/events'

], function(
    ActionButton,
    $,
    Runtime,
    UI,
    Events
) {
    'use strict';
    let mockActionButton,
        runAction = () => {},
        events = Events.make(),
        actionButtons = {
            current: {
                name: null,
                disabled: null
            },
            availableButtons: {
                runApp: {
                    help: 'Run the app',
                    type: 'success',
                    classes: ['-run'],
                    label: 'Run'
                },
                cancel: {
                    help: 'Cancel the running app',
                    type: 'danger',
                    classes: ['-cancel'],
                    label: 'Cancel'
                }
            }
        };


    describe('The action button widget', () => {

        beforeEach( () => {
            var bus = Runtime.make().bus();
            const container = document.createElement('div');
            var ui = UI.make({
                node: container,
                bus: bus
            });

            mockActionButton = ActionButton.make({
                ui: ui,
                actionButtons: actionButtons,
                bus: bus,
                runAction: runAction,
                cssCellType: null
            });
        });

        afterEach(() => {
            mockActionButton = null;
            window.kbaseRuntime = null;
        });

        it('Should load', () => {
            expect(ActionButton).not.toBe(null);
        });

        it('Should return a make function', () => {
            expect(ActionButton.make).toBeDefined();
        });

        it('Has expected functions when made', () => {
            expect(mockActionButton.buildLayout).toBeDefined();
            expect(mockActionButton.setState).toBeDefined();
        });

        it('has a method buildLayout which returns buttons', () => {
            let mockButtons = mockActionButton.buildLayout(events);

            let $buttonContainer = $(mockButtons).find('.kb-bulk-import-action-button__container');
            expect($buttonContainer).toBeDefined();

            let $buttonList = $(mockButtons).find('.kb-bulk-import-action-button__list');
            expect($buttonList).toBeDefined();

            let $runButton = $(mockButtons).find('.-run');
            expect($runButton).toBeDefined();
            expect($runButton.html()).toContain('Run');

            let $cancelButton = $buttonList.find('.-cancel');
            expect($cancelButton).toBeDefined();
            expect($cancelButton.html()).toContain('Cancel');
            expect($cancelButton.hasClass('hidden'));
        });

        it('has a method setState which changes the button state', () => {
            let mockButtons = mockActionButton.buildLayout(events);
            mockActionButton.setState({
                name: 'cancel',
                disable: true
            });

            console.log(mockButtons);
            expect(true).toBeFalse();
        });

    });

});
