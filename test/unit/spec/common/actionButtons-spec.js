define([
    'common/cellComponents/actionButtons',
    'jquery',
    'common/runtime',
    'common/ui',
    'common/events',
], (ActionButton, $, Runtime, UI, Events) => {
    'use strict';
    let mockActionButton, ui, container;
    const runAction = () => {},
        events = Events.make(),
        actionButtons = {
            current: {
                name: 'runApp',
                disabled: false,
            },
            availableButtons: {
                runApp: {
                    help: 'Run the app',
                    type: 'primary',
                    classes: ['-run'],
                    label: 'Run',
                },
                cancel: {
                    help: 'Cancel the running app',
                    type: 'danger',
                    classes: ['-cancel'],
                    label: 'Cancel',
                },
            },
        };

    describe('The action button widget', () => {
        beforeEach(() => {
            const bus = Runtime.make().bus();
            container = document.createElement('div');
            ui = UI.make({
                node: container,
                bus: bus,
            });

            mockActionButton = ActionButton.make({
                ui: ui,
                actionButtons: actionButtons,
                bus: bus,
                runAction: runAction,
                cssCellType: null,
            });
        });

        afterEach(() => {
            mockActionButton = null;
            window.kbaseRuntime = null;
            ui = null;
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
            const mockButtons = mockActionButton.buildLayout(events);

            const $buttonContainer = $(mockButtons).find(
                '.kb-bulk-import-action-button__container'
            );
            expect($buttonContainer).toBeDefined();

            const $buttonList = $(mockButtons).find('.kb-bulk-import-action-button__list');
            expect($buttonList).toBeDefined();

            const $runButton = $(mockButtons).find('.-run');
            expect($runButton).toBeDefined();
            expect($runButton.html()).toContain('Run');

            const $cancelButton = $(mockButtons).find('.-cancel');
            expect($cancelButton).toBeDefined();
            expect($cancelButton.html()).toContain('Cancel');
        });

        it('has a method setState which changes the button state', () => {
            const layout = mockActionButton.buildLayout(events);
            container.innerHTML = layout;
            mockActionButton.setState({
                name: 'cancel',
                disabled: true,
            });

            const $cancelButton = $(container).find('.-cancel');
            expect($cancelButton).toBeDefined();
            expect($cancelButton.html()).toContain('Cancel');
            expect($cancelButton.hasClass('hidden')).toBeFalse();
            expect($cancelButton.hasClass('disabled')).toBeTrue();
        });
    });
});
