define(['/narrative/nbextensions/bulkImportCell/tabs/multiAppInfo', 'common/props', 'testUtil'], (
    MultiAppInfoWidget,
    Props,
    TestUtil
) => {
    'use strict';

    fdescribe('The multi-app info tab', () => {
        describe('module', () => {
            it('exposes a constructor', () => {
                expect(MultiAppInfoWidget.make).toEqual(jasmine.any(Function));
                expect(MultiAppInfoWidget.cssBaseClass).toEqual('kb-bulk-import-info');
            });
        });

        const { cssBaseClass } = MultiAppInfoWidget;
        describe('instance', () => {
            let container;
            beforeEach(async function () {
                container = document.createElement('div');
                this.bus = {
                    emit: () => {
                        /* do nowt */
                    },
                };
                this.model = Props.make({
                    data: {
                        state: {
                            selectedFileType: 'FILE_TYPE_ONE',
                            params: {
                                FILE_TYPE_ONE: 'complete',
                                FILE_TYPE_TWO: 'incomplete',
                                FILE_TYPE_THREE: 'error',
                            },
                        },
                        inputs: {
                            FILE_TYPE_ONE: {
                                appId: 'APP_ONE_ID',
                            },
                            FILE_TYPE_TWO: {
                                appId: 'APP_TWO_ID',
                            },
                            FILE_TYPE_THREE: {
                                appId: 'APP_THREE_ID',
                            },
                        },
                        app: {
                            specs: {
                                APP_ONE_ID: {
                                    full_info: {},
                                    parameters: [],
                                },
                                APP_TWO_ID: {
                                    full_info: {},
                                    parameters: [],
                                },
                                APP_THREE_ID: {
                                    full_info: {},
                                    parameters: [],
                                },
                            },
                        },
                    },
                });

                this.fileTypesDisplay = {
                    FILE_TYPE_ONE: { label: 'file type one' },
                    FILE_TYPE_TWO: { label: 'file type two' },
                    FILE_TYPE_THREE: { label: 'file type three' },
                };

                this.multiAppInfoWidgetInstance = MultiAppInfoWidget.make(this);

                await this.multiAppInfoWidgetInstance.start({
                    node: container,
                });
            });

            afterEach(() => {
                container.remove();
            });
            it('has the expected functions', function () {
                this.instance = MultiAppInfoWidget.make({});
                ['start', 'stop'].forEach((fn) => {
                    expect(this.instance[fn]).toEqual(jasmine.any(Function));
                });
            });

            it('can be started and stopped', async function () {
                container = document.createElement('div');
                this.instance = MultiAppInfoWidget.make(this);
                await this.instance.start({
                    node: container,
                });
                // expect the info table and file type chooser to have child nodes
                expect(
                    container.querySelector(`.${cssBaseClass}__panel--info`).childNodes.length
                ).toBeGreaterThan(0);
                expect(
                    container.querySelector(`.${cssBaseClass}__panel--filetype`).childNodes.length
                ).toBeGreaterThan(0);

                await this.instance.stop();
                expect(container.innerHTML).toBe('');
            });

            it('can switch tabs', async function () {
                spyOn(this.bus, 'emit');

                expect(this.model.getItem('state.selectedFileType')).toEqual('FILE_TYPE_ONE');
                const buttonClass = 'kb-filetype-panel__filetype_button';
                const selectedClass = buttonClass + '--selected';
                const buttons = Array.from(container.querySelectorAll(`.${buttonClass}`));
                expect(buttons[0]).toHaveClass(selectedClass);
                expect(buttons[1]).not.toHaveClass(selectedClass);
                expect(buttons[2]).not.toHaveClass(selectedClass);

                // click on button two and wait for fileTypeTwoButton to be selected
                const fileTypeTwoButton = container.querySelector('[data-element="FILE_TYPE_TWO"]');
                await TestUtil.waitForElementState(
                    fileTypeTwoButton,
                    () => {
                        return fileTypeTwoButton.classList.contains(selectedClass);
                    },
                    () => {
                        fileTypeTwoButton.click();
                    }
                );
                expect(this.model.getItem('state.selectedFileType')).toEqual('FILE_TYPE_TWO');

                // click on button three
                const fileTypeThreeButton = container.querySelector(
                    '[data-element="FILE_TYPE_THREE"]'
                );
                await TestUtil.waitForElementState(
                    fileTypeThreeButton,
                    () => {
                        return fileTypeThreeButton.classList.contains(selectedClass);
                    },
                    () => {
                        fileTypeThreeButton.click();
                    }
                );

                expect(this.model.getItem('state.selectedFileType')).toEqual('FILE_TYPE_THREE');
                expect(this.bus.emit.calls.allArgs()).toEqual([
                    ['toggled-active-filetype', { fileType: 'FILE_TYPE_TWO' }],
                    ['toggled-active-filetype', { fileType: 'FILE_TYPE_THREE' }],
                ]);
            });
        });

        describe('Mode icon display', () => {
            function buildOptions(cellState) {
                const bus = {
                    emit: () => {
                        /* do nowt */
                    },
                };
                const fileTypesDisplay = {
                    FILE_TYPE_ONE: { label: 'file type one' },
                };

                const model = Props.make({
                    data: {
                        state: {
                            selectedFileType: 'FILE_TYPE_ONE',
                            params: {
                                FILE_TYPE_ONE: 'complete',
                            },
                            state: cellState,
                        },
                        inputs: {
                            FILE_TYPE_ONE: {
                                appId: 'APP_ONE_ID',
                            },
                        },
                        app: {
                            specs: {
                                APP_ONE_ID: {
                                    full_info: {},
                                    parameters: [],
                                },
                            },
                        },
                    },
                });

                return {
                    bus,
                    fileTypesDisplay,
                    model,
                };
            }

            // const iconCases = ['editingComplete', 'editingIncomplete'];
            // const noIconCases = ['launching', 'inProgress', 'inProgressResultsAvailable', 'jobsFinishedResultsAvailable', 'jobsFinished', 'error'];
            const iconTestCases = {
                editingComplete: true,
                editingIncomplete: true,
                launching: false,
                inProgress: false,
                inProgressResultsAvailable: false,
                jobsFinishedResultsAvailable: false,
                jobsFinished: false,
                error: false,
            };

            let container;

            beforeEach(() => {
                container = document.createElement('div');
            });

            afterEach(() => {
                container.remove();
            });

            Object.keys(iconTestCases).forEach((testCase) => {
                const withIcon = iconTestCases[testCase];
                it(`${withIcon ? 'shows' : 'does not show'} a file type icon when ${
                    !withIcon ? 'not' : ''
                } in editing states`, async () => {
                    const widgetInstance = MultiAppInfoWidget.make(buildOptions(testCase));
                    await widgetInstance.start({ node: container });
                    const filePanelButtons = container.querySelectorAll(
                        '.kb-bulk-import-info__panel--filetype button'
                    );
                    for (const fpButton of filePanelButtons) {
                        const icon = fpButton.querySelector('.kb-filetype-panel__filetype_icon');
                        const hasCheck = icon.classList.contains('fa-check');
                        const hasExclamation = icon.classList.contains('fa-exclamation');
                        // if withIcon, should have one of fa-exclamation, fa-check
                        // otherwise, should have neither
                        expect(hasCheck || hasExclamation).toBe(withIcon);
                    }
                });
            });
        });
    });
});
