define(['common/cellComponents/tabs/infoTab', 'common/props', 'testUtil'], (
    InfoTab,
    Props,
    TestUtil
) => {
    'use strict';

    describe('The App Info Tab module', () => {
        it('loads', () => {
            expect(InfoTab).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(InfoTab.make).toEqual(jasmine.any(Function));
            expect(InfoTab.cssBaseClass).toEqual(jasmine.any(String));
        });
    });

    describe('The App Info Tab instance', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        const { cssBaseClass } = InfoTab;

        const APP = {
                ONE: {
                    ID: 'my_favourite_app/ever',
                    NAME: 'My Favourite App Ever!!',
                    TAG: 'beta',
                    VERSION: '1.0.1',
                },
                TWO: {
                    ID: 'crap/app',
                    NAME: 'Crap App',
                    TAG: 'whatever!',
                    VERSION: '0.5-beta-6+3',
                },
                THREE: {
                    ID: 'blah-blah-blah',
                    NAME: 'blah blah blah',
                    TAG: 'blah',
                    VERSION: 'halb',
                },
            },
            DOCSTRING = 'View full documentation',
            FONT_TAG_CONTENTS = 'Some text in a font tag';

        const appData = {},
            appModels = {};

        appData[APP.ONE.ID] = {
            executionStats: {
                number_of_calls: 1729,
                total_exec_time: 9001,
            },
            app: {
                spec: {
                    full_info: {
                        description: 'Details about this mock app',
                        name: APP.ONE.NAME,
                        authors: ['Abraham', 'Beckie', 'Charlene', 'Darwin'],
                        id: APP.ONE.ID,
                        subtitle: 'A mock app for testing purposes',
                        ver: APP.ONE.VERSION,
                    },
                    parameters: [
                        {
                            text_options: {
                                valid_ws_types: [
                                    'KBaseRNASeq.RNASeqSampleSet',
                                    'This.Format',
                                    'That.Format',
                                ],
                            },
                            ui_name: `RNA sequence object <font color=red>${FONT_TAG_CONTENTS}</font>`,
                        },
                        {
                            ui_name: 'Adapters',
                        },
                    ],
                },
                tag: APP.ONE.TAG,
            },
        };

        appData[APP.TWO.ID] = {
            // no execution stats
            app: {
                spec: {
                    full_info: {
                        description: '',
                        name: APP.TWO.NAME,
                        authors: [],
                        id: APP.TWO.ID,
                        ver: APP.TWO.VERSION,
                    },
                    parameters: [], // what!!
                },
                // no tag
            },
        };

        appData[APP.THREE.ID] = {
            // this has the tag in the full info, if you can believe it!
            app: {
                spec: {
                    full_info: {
                        name: APP.THREE.NAME,
                        authors: [],
                        id: APP.THREE.ID,
                        ver: APP.THREE.VERSION,
                        tag: APP.THREE.TAG,
                    },
                    parameters: [],
                },
            },
        };

        appData.multi = {
            app: {
                specs: {},
            },
        };

        ['ONE', 'TWO', 'THREE'].forEach((number) => {
            appData.multi.app.specs[APP[number].ID] = appData[APP[number].ID].app.spec;
        });

        Object.keys(appData).forEach((appName) => {
            appModels[appName] = Props.make({
                data: appData[appName],
            });
        });

        async function createInfoTab(context, args = {}) {
            const model = args.model || appModels[APP.ONE.ID];
            context.infoTabInstance = InfoTab.make({ model });

            context.container = document.createElement('div');
            expect(context.container.innerHTML).toBe('');
            args.node = context.container;

            await context.infoTabInstance.start(args);
        }

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('has the required methods', function () {
            this.infoTabInstance = InfoTab.make({
                model: {},
            });
            ['start', 'stop'].forEach((fn) => {
                expect(this.infoTabInstance[fn]).toBeDefined();
                expect(this.infoTabInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('has a method "start" which returns a Promise', async () => {
            const container = document.createElement('div');
            expect(container.innerHTML).toBe('');
            const instance = InfoTab.make({ model: appModels[APP.ONE.ID] });
            const infoTabPromise = instance.start({ node: container });
            expect(infoTabPromise).toEqual(jasmine.any(Promise));
            await infoTabPromise;
            expect(container.innerHTML).toContain(DOCSTRING);
        });

        it('has a method "stop" which returns a Promise and clears its container', async function () {
            // just expect it to have something real.
            await createInfoTab(this);
            expect(this.container.innerHTML).toContain(DOCSTRING);
            const result = this.infoTabInstance.stop();
            expect(result).toEqual(jasmine.any(Promise));
            await result;
            expect(this.container.innerHTML).toEqual('');
        });

        describe('contents, app cell usage', () => {
            let container;

            /**
             * Some parts of the info are missing in a multi-app info tab, so use the boolean `isMulti` to
             * test this situation
             *
             * @param {boolean} isMulti
             */
            function appOneTests(isMulti) {
                it('has the app title, version, and tag', () => {
                    expect(
                        container.querySelector(`.${cssBaseClass}__title`).textContent
                    ).toContain(APP.ONE.NAME);
                    expect(
                        container.querySelector(`.${cssBaseClass}__version`).textContent
                    ).toContain(`v${APP.ONE.VERSION}`);
                    // no tag in the multi-app version
                    if (isMulti) {
                        expect(container.querySelector(`.${cssBaseClass}__tag`)).toBeNull();
                    } else {
                        expect(container.querySelector(`.${cssBaseClass}__tag`).textContent).toBe(
                            APP.ONE.TAG
                        );
                    }
                });
                it('prints out authors correctly', () => {
                    const authorDiv = container.querySelector(`.${cssBaseClass}__authors`);
                    expect(authorDiv.textContent).toContain(
                        'by Abraham, Beckie, Charlene, and Darwin'
                    );
                    expect(authorDiv.querySelectorAll('a').length).toBe(4);
                    expect(authorDiv.querySelectorAll('a')[0].href).toContain('/#people/Abraham');
                });

                it('displays the description', () => {
                    expect(
                        container.querySelector(`.${cssBaseClass}__description`).textContent
                    ).toBe(appData[APP.ONE.ID].app.spec.full_info.description);
                });

                it('links to the full docs', () => {
                    const docsLink = container.querySelector(`.${cssBaseClass}__link--docs a`);
                    if (isMulti) {
                        // no tag in the multi-app version
                        expect(docsLink.href).toContain(`/#appcatalog/app/${APP.ONE.ID}`);
                        expect(docsLink.href).not.toContain(
                            `/#appcatalog/app/${APP.ONE.ID}/${APP.ONE.TAG}`
                        );
                    } else {
                        expect(docsLink.href).toContain(
                            `/#appcatalog/app/${APP.ONE.ID}/${APP.ONE.TAG}`
                        );
                    }
                    expect(docsLink.textContent).toEqual('View full documentation');
                });

                // parameters
                it('returns an item for each parameter', () => {
                    const listItems = container.querySelectorAll(
                        `.${cssBaseClass}__list_item--params`
                    );
                    expect(listItems.length).toBe(appData[APP.ONE.ID].app.spec.parameters.length);
                });

                it('renders parameters with formatting correctly', () => {
                    const fontTagContents = container.querySelectorAll(
                        `.${cssBaseClass}__list_item--params font`
                    );
                    expect(fontTagContents.length).toBe(1);
                    expect(fontTagContents[0].textContent).toBe(FONT_TAG_CONTENTS);
                });

                // check the links to the types
                it('renders links to KBase types correctly', () => {
                    const paramsLinks = container
                        .querySelector(`.${cssBaseClass}__list_item--params`)
                        .querySelectorAll('a');
                    const expectedType =
                        appData[APP.ONE.ID].app.spec.parameters[0].text_options.valid_ws_types[1];
                    expect(paramsLinks[1].href).toContain(`/#spec/type/${expectedType}`);
                    expect(paramsLinks[1].textContent).toBe(expectedType);
                });

                it('renders a parameter with no formatting correctly', () => {
                    const paramTwo = container.querySelectorAll(
                        `.${cssBaseClass}__list_item--params`
                    )[1];
                    expect(paramTwo.innerText).toBe(
                        appData[APP.ONE.ID].app.spec.parameters[1].ui_name
                    );
                });

                it('renders run stats correctly', () => {
                    if (isMulti) {
                        // no run stats in the multi-app version
                        expect(container.querySelector(`.${cssBaseClass}__runstats`)).toBeNull();
                    } else {
                        expect(
                            container.querySelector(`.${cssBaseClass}__runstats`).textContent
                        ).toContain(
                            `This app has been run ${
                                appData[APP.ONE.ID].executionStats.number_of_calls
                            } times`
                        );
                    }
                });
            }

            function appTwoTests() {
                it('has the app title, version, and tag', () => {
                    expect(
                        container.querySelector(`.${cssBaseClass}__title`).textContent
                    ).toContain(APP.TWO.NAME);
                    expect(
                        container.querySelector(`.${cssBaseClass}__version`).textContent
                    ).toContain(`v${APP.TWO.VERSION}`);
                    expect(container.querySelector(`.${cssBaseClass}__tag`)).toBeNull();
                });
                it('prints out authors correctly', () => {
                    const authorDiv = container.querySelector(`.${cssBaseClass}__authors`);
                    expect(authorDiv.textContent).toBe('No authors specified');
                });

                it('displays the description', () => {
                    expect(
                        container.querySelector(`.${cssBaseClass}__description`).textContent
                    ).toBe('No description specified');
                });

                it('links to the full docs', () => {
                    const docsLink = container.querySelector(`.${cssBaseClass}__link--docs a`);
                    expect(docsLink.href).toContain(`/#appcatalog/app/${APP.TWO.ID}`);
                    // there's no tag
                    expect(docsLink.href).not.toContain(`/${APP.TWO.ID}/`);
                    expect(docsLink.textContent).toEqual('View full documentation');
                });

                // parameters
                it('returns the appropriate params', () => {
                    const listItems = Array.from(
                        container.querySelectorAll(`.${cssBaseClass}__list--params`)
                    );
                    expect(listItems.length).toBe(1);
                    expect(listItems[0].textContent).toBe('No parameters specified');
                });

                it('does not render run stats if none exist', () => {
                    expect(container.querySelector(`.${cssBaseClass}__runstats`)).toBeNull();
                });
            }

            function appThreeTests() {
                it('has the app title, version, and tag', () => {
                    expect(
                        container.querySelector(`.${cssBaseClass}__title`).textContent
                    ).toContain(APP.THREE.NAME);
                    expect(
                        container.querySelector(`.${cssBaseClass}__version`).textContent
                    ).toContain(`v${APP.THREE.VERSION}`);
                    expect(container.querySelector(`.${cssBaseClass}__tag`).textContent).toBe(
                        APP.THREE.TAG
                    );
                });
                it('links to the full docs', () => {
                    const docsLink = container.querySelector(`.${cssBaseClass}__link--docs a`);
                    expect(docsLink.href).toContain(
                        `/#appcatalog/app/${APP.THREE.ID}/${APP.THREE.TAG}`
                    );
                });
            }

            afterEach(() => {
                container.remove();
            });

            describe('app one info, single app mode', () => {
                beforeEach(async function () {
                    await createInfoTab(this);
                    container = this.container;
                });
                appOneTests();
            });

            describe('app two info, single app mode', () => {
                beforeEach(async function () {
                    await createInfoTab(this, { model: appModels[APP.TWO.ID] });
                    container = this.container;
                });
                appTwoTests();
            });

            describe('app three info, single app mode', () => {
                beforeEach(async function () {
                    await createInfoTab(this, { model: appModels[APP.THREE.ID] });
                    container = this.container;
                });
                appThreeTests();
            });

            describe('app one info, multi-app mode', () => {
                beforeEach(async function () {
                    await createInfoTab(this, {
                        model: appModels.multi,
                        currentApp: APP.ONE.ID,
                    });
                    container = this.container;
                });
                // test in multi-app mode
                appOneTests(true);
            });

            describe('app two info, multi-app mode', () => {
                beforeEach(async function () {
                    await createInfoTab(this, {
                        model: appModels.multi,
                        currentApp: APP.TWO.ID,
                    });
                    container = this.container;
                });
                appTwoTests();
            });

            describe('app three info, multi-app mode', () => {
                beforeEach(async function () {
                    await createInfoTab(this, {
                        model: appModels.multi,
                        currentApp: APP.THREE.ID,
                    });
                    container = this.container;
                });
                appThreeTests();
            });
        });
    });
});
