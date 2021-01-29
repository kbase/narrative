define ([
    'common/ui',
], (
    UI
) => {
    'use strict';

    // don't require a UI object
    const functions = [
        'buildCollapsiblePanel',
        'buildIcon',
        'buildPanel',
        'confirmDialog',
        'htmlEncode',
        'loading',
        'makeCollapsiblePanel',
        'makePanel',
        'na',
        'showConfirmDialog',
        'showDialog',
        'showErrorDialog',
        'showInfoDialog',
    ];

    const objectFunctions = [
        'activateButton',
        'addClass',
        'buildButton',
        'buildButtonToolbar',
        'buildErrorTabs',
        'buildGridTable',
        'buildPresentableJson',
        'buildTabs',
        'collapsePanel',
        'createNode',
        'deactivateButton',
        'disableButton',
        'enableButton',
        'enableTooltips',
        'expandPanel',
        'getButton',
        'getElement',
        'getElements',
        'getNode',
        'hideButton',
        'hideElement',
        'ifAdvanced',
        'ifDeveloper',
        'isAdvanced',
        'isDeveloper',
        'jsonBlockWidget',
        'makeButton',
        'removeClass',
        'setButtonLabel',
        'setContent',
        'setText',
        'showButton',
        'showElement',
        'updateFromViewModel',
        'updateTab',
    ];


    describe('UI module', () => {
        it('should be defined', () => {
            expect(UI).toBeDefined();
        });

        functions.forEach( f => {
            it (`should have function ${f} defined`, () => {
                expect(UI[f]).toBeDefined();
            })
        });
        objectFunctions.forEach((f) => {
            it (`should not have function ${f} defined`, () => {
                expect(UI[f]).not.toBeDefined();
            });
        });
        it('should have a make function', () => {
            expect(UI.make).toBeDefined();
        })
    });

    describe('a UI instance', () => {
        const uiInstance = UI.make({
            node: {},
            bus: {},
        });

        it('should be defined', () => {
            expect(uiInstance).toBeDefined();
        })
        // all the UI module methods plus the instance methods
        functions.concat(objectFunctions).forEach( f => {
            it (`should have function ${f} defined`, () => {
                expect(uiInstance[f]).toBeDefined();
            });
        });
    });

    describe('the loading function', () => {
        const requiredClasses = ['fa', 'fa-spinner', 'fa-pulse', 'fa-fw'],
            div = document.createElement('div');

        it('should produce a spinning FontAwesome icon without any args', () => {
            div.innerHTML = UI.loading();
            expect(div.getElementsByTagName('span').length).toEqual(1);
            expect(div.getElementsByTagName('span')[0].childNodes.length).toEqual(1);
            expect(div.getElementsByTagName('i').length).toEqual(1);
            const spinner = div.getElementsByTagName('i')[0];
            requiredClasses.forEach((cl) => {
                expect(spinner).toHaveClass(cl);
            });
            // there should be no text content
            expect(spinner.textContent).not.toMatch(/\S/);
            expect(div.getElementsByTagName('span')[0].textContent).not.toMatch(/\S/);
        });
        it('should produce a different spinning icon with args', () => {
            const iconMessage = 'So long, and thanks for all the fish',
                iconSize = '5x',
                iconColor = 'deepskyblue',
                iconClass = 'another-cool-icon',
                iconStr = UI.loading({
                    message: iconMessage,
                    size: iconSize,
                    color: iconColor,
                    class: iconClass,
                }),
                allClasses = requiredClasses.concat([`fa-${iconSize}`, iconClass]);
            div.innerHTML = iconStr;
            expect(iconStr).toMatch(/style.*?color.*?deepskyblue/);
            expect(div.textContent).toContain(`${iconMessage}...`);
            const spinner = div.getElementsByTagName('i')[0];
            allClasses.forEach((cl) => {
                expect(spinner).toHaveClass(cl);
            })
            expect(spinner.textContent).not.toMatch(/\S/);
        })
    });
});
