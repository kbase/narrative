define(['common/ui', 'testUtil'], (UI, TestUtil) => {
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

    const cssClassName = UI.cssClassName;

    const baseIconClasses = ['fa', `${cssClassName}__icon`];

    function checkElement(el, checkObj) {
        if (checkObj.class) {
            checkClasses(el, checkObj.class);
        }
        if (checkObj.attribute) {
            checkAttributes(el, checkObj.attribute);
        }
        if (checkObj.property) {
            checkProperties(el, checkObj.property);
        }
    }

    /**
     * Check whether an element possesses or lacks certain classes
     * @param {DOM} el - DOM element
     * @param {object} classes in the form className: (true|false), where
     *                          true means the class should be present
     *                          false means the class should NOT be present
     */
    function checkClasses(el, classes) {
        Object.keys(classes).forEach((cl) => {
            if (classes[cl]) {
                expect(el).toHaveClass(cl);
            } else {
                expect(el).not.toHaveClass(cl);
            }
        });
    }

    /**
     * Check whether an element has or lacks attributes
     * @param {DOM} el - DOM element
     * @param {object} attribs in the form attrName: attrValue
     */
    function checkAttributes(el, attribs) {
        Object.keys(attribs).forEach((attr) => {
            expect(el.getAttribute(attr)).toEqual(attribs[attr]);
        });
    }

    /**
     * Check whether an element has or lacks properties
     * @param {DOM} el - DOM element
     * @param {object} properties in the form propName: propValue
     */
    function checkProperties(el, props) {
        Object.keys(props).forEach((prop) => {
            expect(el[prop]).toEqual(props[prop]);
        });
    }

    describe('UI module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('should be defined', () => {
            expect(UI).toBeDefined();
        });

        functions.forEach((f) => {
            it(`should have function ${f} defined`, () => {
                expect(UI[f]).toBeDefined();
            });
        });
        objectFunctions.forEach((f) => {
            it(`should not have function ${f} defined`, () => {
                expect(UI[f]).not.toBeDefined();
            });
        });
        it('should have a make function', () => {
            expect(UI.make).toBeDefined();
        });
    });

    describe('a UI instance', () => {
        const uiInstance = UI.make({
            node: {},
            bus: {},
        });

        it('should be defined', () => {
            expect(uiInstance).toBeDefined();
        });
        // all the UI module methods plus the instance methods
        functions.concat(objectFunctions).forEach((f) => {
            it(`should have function ${f} defined`, () => {
                expect(uiInstance[f]).toBeDefined();
            });
        });
    });

    describe('the loading function', () => {
        const requiredClasses = ['fa', 'fa-spinner', 'fa-pulse', 'fa-fw'];
        let container;

        beforeEach(() => {
            container = document.createElement('div');
        });

        afterEach(() => {
            container.remove();
        });
        it('should produce a spinning FontAwesome icon without any args', () => {
            container.innerHTML = UI.loading();
            expect(container.getElementsByTagName('span').length).toEqual(1);
            expect(container.getElementsByTagName('span')[0].childNodes.length).toEqual(1);
            expect(container.getElementsByTagName('i').length).toEqual(1);
            const spinner = container.getElementsByTagName('i')[0];
            requiredClasses.forEach((cl) => {
                expect(spinner).toHaveClass(cl);
            });
            // there should be no text content
            expect(spinner.textContent).not.toMatch(/\S/);
            expect(container.getElementsByTagName('span')[0].textContent).not.toMatch(/\S/);
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
            container.innerHTML = iconStr;
            expect(iconStr).toMatch(/style.*?color.*?deepskyblue/);
            expect(container.textContent).toContain(`${iconMessage}...`);
            const spinner = container.getElementsByTagName('i')[0];
            allClasses.forEach((cl) => {
                expect(spinner).toHaveClass(cl);
            });
            expect(spinner.textContent).not.toMatch(/\S/);
        });
    });

    const plainIconArgs = {
        name: 'cube',
    };

    function itIsAPlainIcon(icon) {
        expect(icon).toBeDefined();
        expect(icon.tagName).toBe('SPAN');
        // class list will be the baseIconClasses plus name
        expect(icon.classList.length).toBe(baseIconClasses.length + 1);
        checkClasses(icon, { fa: true, 'fa-cube': true, 'kb-ui__icon': true });
        expect(icon.getAttribute('style')).toBe('');
    }

    const fancyIconArgs = {
        name: 'circle', // fa-<class>
        rotate: 180, // fa-rotate-<string>,
        flip: 'up', // fa-flip-<string>,
        size: 15, // number: fa-<n>x or string fa-<string>
        classes: ['maths', 'science', 'french'], // more classes
        style: { width: '100px', textDecoration: 'underline' }, // you guessed it!
        color: 'deepskyblue', // style.color
    };

    function itIsAFancyIcon(icon) {
        expect(icon).toBeDefined();
        expect(icon.tagName).toBe('SPAN');
        const classes = [
            'fa-circle',
            'fa-rotate-180',
            'fa-flip-up',
            'fa-15x',
            'maths',
            'science',
            'french',
        ];
        expect(icon.classList.length).toBe(baseIconClasses.length + classes.length);

        const fancyClasses = baseIconClasses
            .concat(classes)
            .reduce((o, key) => ({ ...o, [key]: true }), {});
        checkClasses(icon, fancyClasses);

        const styleRegexes = [
            /width:.*?100px/,
            /color:.*?deepskyblue/,
            /text-decoration:.*?underline/,
        ];
        styleRegexes.forEach((regex) => {
            expect(icon.getAttribute('style')).toMatch(regex);
        });
    }

    describe('the icon function', () => {
        let div;
        beforeEach(() => {
            div = document.createElement('div');
        });
        afterEach(() => {
            div.remove();
        });

        it('will create an empty string without a "name" argument', () => {
            spyOn(console, 'error').and.callThrough();
            const icon = UI.buildIcon();
            expect(console.error).toHaveBeenCalledOnceWith('Cannot create icon: no name supplied');
            expect(icon).toEqual('');
        });

        it('can make a very plain icon with a name argument', () => {
            div.innerHTML = UI.buildIcon(plainIconArgs);
            const icon = div.querySelector('[data-element="icon"]');
            itIsAPlainIcon(icon);
        });

        it('can accept a string for size', () => {
            const name = 'cube';
            div.innerHTML = UI.buildIcon({ name: name, size: '2x' });
            const icon = div.querySelector('[data-element="icon"]');
            expect(icon).toBeDefined();
            expect(icon).toHaveClass('fa-2x');
        });

        it('can accept a number for size', () => {
            const name = 'cube';
            div.innerHTML = UI.buildIcon({ name: name, size: 3 });
            const icon = div.querySelector('[data-element="icon"]');
            expect(icon).toBeDefined();
            expect(icon).toHaveClass('fa-3x');
        });

        it('can make a fancy icon with more arguments', () => {
            div.innerHTML = UI.buildIcon(fancyIconArgs);
            const icon = div.querySelector('[data-element="icon"]');
            itIsAFancyIcon(icon);
        });
    });

    describe('the buildButton function', () => {
        let div;
        beforeEach(function () {
            div = document.createElement('div');
            this.ui = UI.make({ node: div });
        });
        afterEach(() => {
            div.remove();
        });

        it('can build a very basic button', function () {
            div.innerHTML = this.ui.buildButton({
                tip: 'tooltip',
                name: 'testButton',
            });

            const button = div.querySelector('button');
            const classes = {
                btn: true,
                'btn-default': true,
                hidden: false,
            };
            const attributes = {
                title: 'tooltip',
                'data-button': 'testButton',
            };
            checkElement(button, {
                class: classes,
                attribute: attributes,
            });

            // no icon
            const innerSpans = button.querySelectorAll('span');
            expect(innerSpans.length).toBe(1);
            expect(innerSpans[0]).toHaveClass(`${cssClassName}__button_label`);
            expect(innerSpans[0].textContent).toBe('');
        });

        it('can build a button with a label and a simple icon', function () {
            const label = 'simple icon button',
                name = 'testButtonWithIcon';

            div.innerHTML = this.ui.buildButton({
                label: label,
                name: name,
                icon: plainIconArgs,
            });

            const button = div.querySelector('button');
            const classes = {
                btn: true,
                'btn-default': true,
                hidden: false,
            };
            const attributes = {
                title: label,
                'data-button': name,
            };
            checkElement(button, {
                class: classes,
                attribute: attributes,
            });

            const innerSpans = button.querySelectorAll('span');
            // there will be two spans, the icon and the label
            expect(innerSpans.length).toBe(2);
            itIsAPlainIcon(innerSpans[0]);
            expect(innerSpans[1]).toHaveClass(`${cssClassName}__button_label`);
            expect(innerSpans[1].textContent).toBe(label);
        });

        it('can build a button with a fancy icon', function () {
            const label = 'fancy icon button',
                name = 'testButtonWithFancyIcon';
            div.innerHTML = this.ui.buildButton({
                label: label,
                name: name,
                icon: fancyIconArgs,
            });

            const button = div.querySelector('button');
            const classes = {
                btn: true,
                'btn-default': true,
                hidden: false,
            };
            const attributes = {
                title: label,
                'data-button': name,
            };
            checkElement(button, {
                class: classes,
                attribute: attributes,
            });

            const innerSpans = button.querySelectorAll('span');
            expect(innerSpans.length).toBe(2);
            itIsAFancyIcon(innerSpans[0]);
            expect(innerSpans[1]).toHaveClass(`${cssClassName}__button_label`);
            expect(innerSpans[1].textContent).toBe(label);
        });

        it('can build a far fancier button', function () {
            const label = 'Fancy Pants Button',
                name = 'fancyButton',
                title = 'Whoa! What a button!';
            div.innerHTML = this.ui.buildButton({
                classes: ['foo', 'bar', 'baz'],
                event: {},
                features: ['this', 'that'],
                hidden: true,
                icon: fancyIconArgs,
                label: label,
                name: name,
                style: {},
                tip: 'this will not be shown!',
                title: title,
                type: 'my-fave',
            });

            const button = div.querySelector('button');
            const classes = {
                btn: true,
                'btn-my-fave': true,
                hidden: true,
                foo: true,
                bar: true,
                baz: true,
            };
            const attributes = {
                title: title,
                'data-button': name,
                'data-feature-this': '',
                'data-feature-that': '',
            };
            checkElement(button, {
                class: classes,
                attribute: attributes,
            });

            const innerSpans = button.querySelectorAll('span');
            // there will be two spans, the icon and the label
            expect(innerSpans.length).toBe(2);
            itIsAFancyIcon(innerSpans[0]);
            expect(innerSpans[1]).toHaveClass(`${cssClassName}__button_label`);
            expect(innerSpans[1].textContent).toBe(label);
        });
    });

    describe('get buttons with getButton', () => {
        let div;
        beforeEach(function () {
            div = document.createElement('div');
            this.ui = UI.make({ node: div });
            div.innerHTML = [
                this.ui.buildButton({
                    label: 'apple button',
                    name: 'apple',
                }),
                this.ui.buildButton({
                    label: 'banana button',
                    name: 'banana',
                }),
            ].join('\n');
        });
        afterEach(() => {
            div.remove();
        });

        it('can get buttons', function () {
            const bananaButton = this.ui.getButton('banana');
            expect(bananaButton.textContent).toMatch(/banana button/);

            const appleButton = this.ui.getButton('apple');
            expect(appleButton.textContent).toMatch(/apple button/);
        });

        it('cannot find buttons that do not exist', function () {
            const ui = this.ui;

            expect(() => {
                ui.getButton('clementine');
            }).toThrowError(Error, 'Button clementine not found');
        });

        const badInputs = [null, undefined, 12345, ['this', 'that'], { this: 'that' }];
        badInputs.forEach((input) => {
            it(`getButton will throw an error with invalid input ${JSON.stringify(
                input
            )}`, function () {
                const ui = this.ui;
                expect(() => {
                    ui.getButton(input);
                }).toThrowError(Error, 'Currently only a single string supported to get a button');
            });
        });

        it('can enable buttons', function () {
            const bananaButton = this.ui.getButton('banana');
            bananaButton.classList.add('hidden');
            bananaButton.classList.add('disabled');
            bananaButton.setAttribute('disabled', true);

            checkElement(bananaButton, {
                class: { hidden: true, disabled: true },
                attribute: { disabled: 'true' },
            });

            this.ui.enableButton('banana');
            checkElement(bananaButton, {
                class: { hidden: false, disabled: false },
            });
            expect(bananaButton.getAttribute('disabled')).toBeNull();
        });

        it('can disable buttons', function () {
            const bananaButton = this.ui.getButton('banana');
            checkElement(bananaButton, {
                class: { hidden: false, disabled: false },
            });
            expect(bananaButton.getAttribute('disabled')).toBeNull();

            this.ui.disableButton('banana');
            checkElement(bananaButton, {
                class: { hidden: false, disabled: true },
                attribute: { disabled: 'true' },
            });
        });

        it('can activate buttons', function () {
            const bananaButton = this.ui.getButton('banana');
            checkElement(bananaButton, {
                class: { active: false },
            });

            this.ui.activateButton('banana');
            checkElement(bananaButton, {
                class: { active: true },
            });
        });

        it('can deactivate buttons', function () {
            const bananaButton = this.ui.getButton('banana');
            bananaButton.classList.add('active');
            checkElement(bananaButton, {
                class: { active: true },
            });

            this.ui.deactivateButton('banana');
            checkElement(bananaButton, {
                class: { active: false },
            });
        });

        it('can hide buttons', function () {
            const bananaButton = this.ui.getButton('banana');
            checkElement(bananaButton, {
                class: { hidden: false },
            });

            this.ui.hideButton('banana');
            checkElement(bananaButton, {
                class: { hidden: true },
            });
        });

        it('can show buttons', function () {
            const bananaButton = this.ui.getButton('banana');
            bananaButton.classList.add('hidden');
            checkElement(bananaButton, {
                class: { hidden: true },
            });

            this.ui.showButton('banana');
            checkElement(bananaButton, {
                class: { hidden: false },
            });
        });

        it('can set a button label', function () {
            const bananaButton = this.ui.getButton('banana');
            expect(bananaButton.textContent).toMatch(/banana button/);
            this.ui.setButtonLabel('banana', 'the great big banana!');
            expect(bananaButton.textContent).toMatch(/the great big banana!/);
        });
    });

    describe('dialog function', () => {
        function buttonCheck(bs) {
            expect(document.querySelector('[data-element="cancel"]')).not.toHaveClass(`btn-${bs}`);
            expect(document.querySelector('[data-element="ok"]')).toHaveClass(`btn-${bs}`);
            document.querySelector('[data-element="ok"]').click();
        }

        describe('dialog theming', () => {
            const classes = ['success', 'info', 'warning', 'danger'];
            classes.forEach((bs) => {
                it(`can use the bootstrap ${bs} theme`, async () => {
                    await UI.showConfirmDialog({
                        body: `${bs} test dialog`,
                        title: bs,
                        okLabel: bs,
                        bsClass: bs,
                        doThisFirst: () => {
                            expect(document.querySelector('.modal-header')).toHaveClass(`bg-${bs}`);
                            expect(document.querySelector('.modal-title')).toHaveClass(
                                `text-${bs}`
                            );
                            buttonCheck(bs);
                        },
                    });
                });
            });

            it('can use the bootstrap primary theme', async () => {
                const bs = 'primary';
                await UI.showConfirmDialog({
                    body: `${bs} test dialog`,
                    title: bs,
                    okLabel: bs,
                    bsClass: bs,
                    doThisFirst: () => {
                        expect(document.querySelector('.modal-header')).toHaveClass(`bg-${bs}`);
                        // uses the text colour from the bg
                        expect(document.querySelector('.modal-title')).not.toHaveClass(
                            `text-${bs}`
                        );
                        buttonCheck(bs);
                    },
                });
            });

            it('can be unthemed', async () => {
                const bs = 'primary';
                await UI.showConfirmDialog({
                    body: `unthemed test dialog`,
                    title: 'No theme',
                    doThisFirst: () => {
                        // no background!
                        expect(document.querySelector('.modal-header')).not.toHaveClass(`bg-${bs}`);
                        expect(document.querySelector('.modal-title')).toHaveClass(`text-${bs}`);
                        buttonCheck(bs);
                    },
                });
            });
        });

        describe('showConfirmDialog', () => {
            const clickLocation = {
                '.modal-header .close': false,
                '[data-element="ok"]': true,
                '[data-element="cancel"]': false,
                // modal backdrop
                '.modal': false,
            };
            const keyCode = {
                13: true,
                27: false,
            };
            Object.keys(clickLocation).forEach((loc) => {
                it(`returns ${clickLocation[loc]} when clicking on ${loc}`, async () => {
                    await UI.showConfirmDialog({
                        title: 'showConfirmDialog',
                        body: 'blah blah blah',
                        doThisFirst: () => {
                            document.querySelector(loc).click();
                        },
                    }).then((res) => {
                        expect(res).toBe(clickLocation[loc]);
                        expect(document.querySelector('.modal-dialog')).toBeNull();
                    });
                });
            });

            Object.keys(keyCode).forEach((key) => {
                it(`returns ${keyCode[key]} when hitting key ${key}`, async () => {
                    await UI.showConfirmDialog({
                        title: 'showConfirmDialog',
                        body: 'blah blah blah',
                        doThisFirst: () => {
                            const e = new KeyboardEvent('keyup', { key: key });
                            document.querySelector('.modal').dispatchEvent(e);
                        },
                    }).then((res) => {
                        expect(res).toBe(keyCode[key]);
                        expect(document.querySelector('.modal-dialog')).toBeNull();
                    });
                });
            });
        });

        const dialogData = {
            Info: {
                body: 'Info dialog body',
            },
            Error: {
                error: Error('string'),
            },
        };
        // showInfoDialog and showErrorDialog
        Object.keys(dialogData).forEach((dialog) => {
            describe(`show${dialog}Dialog`, () => {
                const clickLocation = {
                    '.modal-header .close': false,
                    '[data-element="ok"]': false,
                    // modal backdrop
                    '.modal': false,
                };
                Object.keys(clickLocation).forEach((loc) => {
                    it(`returns ${clickLocation[loc]} when clicking on ${loc}`, async () => {
                        const args = Object.assign(dialogData[dialog], {
                            title: `show an ${dialog} dialog`,
                            doThisFirst: () => {
                                document.querySelector(loc).click();
                            },
                        });

                        await UI[`show${dialog}Dialog`](args).then((outcome) => {
                            expect(outcome).toBeFalse();
                            expect(document.querySelector('.modal-dialog')).toBeNull();
                        });
                    });
                });

                // enter and escape keys should close the modal
                const keyCodes = [13, 27];
                keyCodes.forEach((key) => {
                    it(`returns false when hitting key ${key}`, async () => {
                        const args = Object.assign(dialogData[dialog], {
                            title: `show an ${dialog} dialog`,
                            doThisFirst: () => {
                                const e = new KeyboardEvent('keyup', { key: key });
                                document.querySelector('.modal').dispatchEvent(e);
                            },
                        });

                        await UI[`show${dialog}Dialog`](args).then((outcome) => {
                            expect(outcome).toBeFalse();
                            expect(document.querySelector('.modal-dialog')).toBeNull();
                        });
                    });
                });
            });
        });

        describe('showDialog', () => {
            const clickLocation = {
                '.modal-header .close': { action: 'cancel' },
                '[data-element="cancel"]': { action: 'cancel' },
                '[data-element="link"]': { action: 'link', result: 'I DID THIS!' },
                // modal backdrop
                '.modal': { action: 'cancel' },
            };

            Object.keys(clickLocation).forEach((loc) => {
                it(`returns ${clickLocation[loc]} when clicking on ${loc}`, async () => {
                    await UI.showDialog({
                        title: 'show dialog',
                        body: 'some old crap',
                        cancelLabel: 'CLICK ME!',
                        buttons: [
                            {
                                action: 'link',
                                label: 'View in App Catalog',
                                handler: function () {
                                    return 'I DID THIS!';
                                },
                            },
                        ],
                        options: {
                            width: '70%',
                        },
                        doThisFirst: () => {
                            document.querySelector(loc).click();
                        },
                    }).then((res) => {
                        expect(res).toEqual(clickLocation[loc]);
                        expect(document.querySelector('.modal-dialog')).toBeNull();
                    });
                });
            });
        });
    });
});
