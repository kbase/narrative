define([
    'common/cellComponents/cellControlPanel',
    // 'jquery',
    'common/runtime',
    'common/ui',
    'common/events',
], (CellControlPanel, Runtime, UI, Events) => {
    'use strict';

    let container;
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

    describe('The cell control panel widget', () => {
        beforeEach(function () {
            this.bus = Runtime.make().bus();
            container = document.createElement('div');
            this.ui = UI.make({
                node: container,
                bus: this.bus,
            });

            this.cellControlPanelInstance = CellControlPanel.make({
                ui: this.ui,
                bus: this.bus,
                action: {
                    runAction: runAction,
                    actions: actionButtons,
                },
            });
        });

        afterEach(() => {
            container.remove();
        });

        it('Should load', () => {
            expect(CellControlPanel).toBeDefined();
        });

        it('Should return a make function', () => {
            expect(CellControlPanel.make).toBeDefined();
        });

        it('Has expected functions when made', function () {
            ['buildLayout', 'setActionState', 'setExecMessage'].forEach((fn) => {
                expect(this.cellControlPanelInstance[fn]).toBeDefined();
                expect(this.cellControlPanelInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('has a method buildLayout which returns a control panel', function () {
            container.innerHTML = this.cellControlPanelInstance.buildLayout(events);

            // test for run-control-panel.fsm-display, execMessage, toolbar
            const elements = ['fsm-display', 'execMessage', 'toolbar'];
            elements.forEach((elementName) => {
                const el = this.ui.getElement(`run-control-panel.${elementName}`);
                expect(el).toBeDefined();
                expect(el.tagName).toBe('DIV');
                expect(el.getAttribute('data-element')).toEqual(elementName);
            });

            // check for the action button stuff
            const buttonContainer = container.querySelector(
                '.kb-bulk-import-action-button__container'
            );
            expect(buttonContainer).toBeDefined();

            const buttonList = container.querySelector('.kb-bulk-import-action-button__list');
            expect(buttonList).toBeDefined();

            const runButton = container.querySelector('.-run');
            expect(runButton).toBeDefined();
            expect(runButton.textContent).toContain('Run');

            const cancelButton = container.querySelector('.-cancel');
            expect(cancelButton).toBeDefined();
            expect(cancelButton.textContent).toContain('Cancel');
        });

        describe('the cellControlPanel instance', () => {
            beforeEach(function () {
                container.innerHTML = this.cellControlPanelInstance.buildLayout(events);
            });

            it('has a method setActionState which changes the action button state', function () {
                const runButton = container.querySelector('.-run');
                const cancelButton = container.querySelector('.-cancel');
                expect(runButton).toBeDefined();
                expect(runButton).not.toHaveClass('hidden');
                expect(runButton).not.toHaveClass('disabled');

                expect(cancelButton).toBeDefined();
                expect(cancelButton).not.toHaveClass('hidden');
                expect(cancelButton).not.toHaveClass('disabled');

                this.cellControlPanelInstance.setActionState({
                    name: 'cancel',
                    disabled: true,
                });

                expect(runButton).toHaveClass('hidden');
                expect(runButton).not.toHaveClass('disabled');

                expect(cancelButton).not.toHaveClass('hidden');
                expect(cancelButton).toHaveClass('disabled');
            });

            it('has a method setExecMessage that sets a message', function () {
                expect(container.querySelector('[data-element="execMessage"]').innerHTML).toBe('');
                // set a message
                const messageString = 'this is the message';
                this.cellControlPanelInstance.setExecMessage(messageString);
                expect(container.querySelector('[data-element="execMessage"]').innerHTML).toBe(
                    messageString
                );
                // clear the container
                this.cellControlPanelInstance.setExecMessage('');
                expect(container.querySelector('[data-element="execMessage"]').innerHTML).toBe('');
                // set another message
                this.cellControlPanelInstance.setExecMessage(
                    '<div>This is a <a href="#">link</a></div>'
                );
                expect(
                    container.querySelector('[data-element="execMessage"]').childNodes.length
                ).toBe(1);
                expect(container.querySelector('[data-element="execMessage"] a')).toBeDefined();
                expect(container.querySelector('[data-element="execMessage"] a').textContent).toBe(
                    'link'
                );

                // clear the container using null
                this.cellControlPanelInstance.setExecMessage(null);
                expect(
                    container.querySelector('[data-element="execMessage"]').childNodes.length
                ).toBe(0);
                expect(container.querySelector('[data-element="execMessage"]').innerHTML).toBe('');
            });
        });
    });
});
