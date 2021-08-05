define(['common/cellComponents/cellTabs', 'common/runtime', 'testUtil'], (
    CellTabs,
    Runtime,
    TestUtil
) => {
    'use strict';
    let container;
    const tabSet = {
        selected: 'banana',
        tabs: {
            apple: {
                label: 'Apple',
                icon: { this: 'that' },
                type: 'solar-powered',
                features: ['green', 'crispy'],
            },
            banana: {
                label: 'Banana',
                icon: 'iconString',
            },
            clementine: {},
            dragonfruit: {
                label: 'Here be dragons!',
            },
        },
    };
    const toggleAction = (tab) => {
        console.warn(`performing action on tab ${tab}`);
    };

    describe('The CellTabs module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('Should load', () => {
            expect(CellTabs).toEqual(jasmine.any(Object));
        });

        it('Should return a make function', () => {
            expect(CellTabs.make).toEqual(jasmine.any(Function));
        });
        it('should have a cssBaseClass', () => {
            expect(CellTabs.cssBaseClass).toBeDefined();
        });
    });

    function checkElement(el, checkObj) {
        if (checkObj.class) {
            checkClasses(el, checkObj.class);
        }
        if (checkObj.attribute) {
            checkAttributes(el, checkObj.attribute);
        }
    }

    /**
     * Check whether an element possesses or lacks certain classes
     * @param {DOM} el - DOM element
     * @param {object} classes in the form BaseClass: (true|false), where
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

    describe('The CellTabs instance', () => {
        beforeEach(function () {
            container = document.createElement('div');
            this.bus = Runtime.make().bus();
            this.cellTabsInstance = CellTabs.make({
                bus: this.bus,
                tabs: tabSet,
                toggleAction: toggleAction,
            });
        });

        afterEach(() => {
            container.remove();
            TestUtil.clearRuntime();
        });

        it('has the expected functions when made', function () {
            const functions = ['setState', 'start', 'stop'];
            functions.forEach((fn) => {
                expect(this.cellTabsInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('the layout of the started instance', () => {
            const defaultClasses = {
                'kb-app-cell-btn': true,
                hidden: true,
            };
            defaultClasses[`${CellTabs.cssBaseClass}__tab-button`] = true;

            beforeEach(async function () {
                await this.cellTabsInstance.start({ node: container });
            });

            it('has an apple button', () => {
                // apple: {
                //     label: 'Apple', // textContent
                //     icon: { this: 'that' }, // this is invalid - won't create an icon
                //     type: 'solar-powered', // hasClass('btn-solar-powered')
                //     features: ['green', 'crispy'], // data-feature-<str>=''
                // },

                const appleButton = container.querySelector('[data-button="apple"]');
                checkElement(appleButton, {
                    class: Object.assign({ 'btn-solar-powered': true }, defaultClasses),
                    attribute: {
                        'data-feature-green': '',
                        'data-feature-crispy': '',
                    },
                });
                const appleButtonSpans = appleButton.querySelectorAll('span');
                expect(appleButtonSpans.length).toBe(1);
                // label
                expect(appleButtonSpans[0].textContent).toContain('Apple');
            });

            it('has a banana button', () => {
                // banana: { // hasClass 'btn-primary'
                //     label: 'Banana', // textContent = 'Banana'
                //     icon: 'iconString', // icon should have class 'fa-iconString'
                // },
                const bananaButton = container.querySelector('[data-button="banana"]');
                checkElement(bananaButton, {
                    class: Object.assign({ 'btn-primary': true }, defaultClasses),
                });
                const bananaButtonSpans = bananaButton.querySelectorAll('span');
                expect(bananaButtonSpans.length).toBe(2);
                // icon
                expect(bananaButtonSpans[0]).toHaveClass('fa');
                expect(bananaButtonSpans[0]).toHaveClass('fa-iconString');
                // label
                expect(bananaButtonSpans[1].textContent).toContain('Banana');
            });
            it('has no clementine button', () => {
                // clementine: {}
                expect(container.querySelector('[data-button="clementine"]')).toBeNull();
            });

            it('has a dragonfruit button', () => {
                // dragonfruit: { // hasClass('btn-primary')
                //     label: 'Here be dragons!',
                // },
                const dragonButton = container.querySelector('[data-button="dragonfruit"]');
                checkElement(dragonButton, {
                    class: Object.assign({ 'btn-primary': true }, defaultClasses),
                });
                const dragonButtonSpans = dragonButton.querySelectorAll('span');
                expect(dragonButtonSpans.length).toBe(1);
                expect(dragonButtonSpans[0].textContent).toContain('Here be dragons!');
            });

            it('has an outdated button', () => {
                // there is also a hidden 'outdated' button
                const outdated = container.querySelector('[data-element="outdated"]');
                expect(outdated).toBeDefined();
                expect(outdated).toHaveClass('hidden');
            });
        });

        describe('the started instance', () => {
            beforeEach(async function () {
                await this.cellTabsInstance.start({ node: container });
            });

            it('can set the state of the tabs', function () {
                const allTabs = container.querySelectorAll('.kb-app-cell-btn');
                // initially, all tabs are hidden and inactive
                allTabs.forEach((tab) => {
                    checkElement(tab, {
                        class: { hidden: true, disabled: false, active: false },
                        attribute: { disabled: null },
                    });
                });

                this.cellTabsInstance.setState({
                    tabs: {
                        apple: {
                            enabled: false,
                            visible: true,
                        },
                        banana: {
                            visible: false,
                        },
                        dragonfruit: {
                            enabled: true,
                            visible: true,
                        },
                    },
                });

                // apple button: disabled, visible
                let button = container.querySelector('[data-button="apple"]');
                checkElement(button, {
                    class: { hidden: false, disabled: true, active: false },
                    attribute: { disabled: 'true' },
                });

                // banana tab: hidden, disabled
                button = container.querySelector('[data-button="banana"]');
                checkElement(button, {
                    class: { hidden: true, disabled: true, active: false },
                    attribute: { disabled: 'true' },
                });

                // dragonfruit tab: enabled, visible
                button = container.querySelector('[data-button="dragonfruit"]');
                checkElement(button, {
                    class: { hidden: false, disabled: false, active: false },
                    attribute: { disabled: null },
                });

                // now activate a button
                this.cellTabsInstance.setState({
                    selected: 'banana',
                    tabs: [],
                });
                button = container.querySelector('[data-button="banana"]');
                checkElement(button, {
                    class: { hidden: true, disabled: true, active: true },
                    attribute: { disabled: 'true' },
                });

                ['apple', 'dragonfruit'].forEach((fruit) => {
                    button = container.querySelector(`[data-button="${fruit}"]`);
                    expect(button).not.toHaveClass('active');
                });
            });

            // TODO: test that passing a 'control-panel-tab' bus message
            // triggers the tabToggleAction
            xit('can pass messages on to tabs', function () {
                const message = {
                    data: { tab: 'banana' },
                };
                this.bus.emit('control-panel-tab', message);
                // add in a test for toggleAction
            });
        });
    });
});
