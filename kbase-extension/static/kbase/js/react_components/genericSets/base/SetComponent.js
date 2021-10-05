define([
    'React',
    '../../ShowError',
    'bootstrap',
    'css!./SetComponent.css'
], (
    React,
    ShowError
) => {
    'use strict';

    const { createElement: e, Component } = React;

    class SetComponent extends Component {
        constructor(props) {
            super(props);
            this.tabsRef = null;
        }

        renderError() {
            return e(ShowError, {
                error: this.state.error
            });
        }

        selectItem(event) {
            const selectControl = event.target;
            this.props.selectItem(selectControl.value);
        }

        renderErrorMessage(error) {
            return e('span', [
                e('span', {
                    style: {
                        fontWeight: 'bold'
                    }
                }, 'Error!'),
                e('span', {
                }, error.message),
            ]);
        }

        renderItemType() {
            const selectedItem = this.props.set.selectedItem;
            const content = [];
            if (selectedItem.status === null) {
                content.push(this.renderLoading());
            } else if (selectedItem.status === 'error') {
                content.push(this.renderErrorMessage(selectedItem.error));
            } else {
                if (selectedItem.value) {
                    content.push(e('a', {
                        href: `/#spec/type/${selectedItem.value.objectInfo.type}`,
                        target: '_blank'
                    }, selectedItem.value.objectInfo.type));
                }
                if (selectedItem.status === 'loading') {
                    content.push(this.renderLoading());
                }
            }

            return e('div', {
                style: {
                    display: 'inline-block',
                    position: 'relative'
                }
            }, content);
        }

        renderSelector() {
            return [
                e('div', {
                    className: 'Col'
                }, 'Select alignment to view:'),
                e('div', {
                    className: 'form-inline Col',
                }, e('div', { className: 'form-group' }, [
                    e('select', {
                        onChange: this.selectItem.bind(this),
                        className: 'form-control',
                        style: {
                            marginLeft: '0',
                            marginRight: '0',
                            padding: '4px'
                        }
                    }, this.props.set.value.items.map(({ label, ref, objectInfo }) => {
                        return e('option', { value: ref }, [
                            e('span', null, [
                                objectInfo.name,
                                '(', label, ')'
                            ])]);
                    }))
                ]))
            ];
        }

        renderHeader() {
            return e('div', {
                className: 'Table'

            }, [
                e('div', {
                    className: 'Row'
                }, [
                    e('div', {
                        className: 'Col'
                    }, 'Description:'),
                    e('div', {
                        className: 'Col'
                    }, this.props.set.value.description)
                ]),
                e('div', {
                    className: 'Row'
                }, [
                    e('div', {
                        className: 'Col'
                    }, 'Alignment type:'),
                    e('div', {
                        className: 'Col'
                    }, this.renderItemType())
                ]),
                e('div', {
                    className: 'Row'
                }, this.renderSelector()),
            ]);
        }

        clickTab(event) {
            event.preventDefault();
            const tabID = event.target.getAttribute('href').substr(1);
            const selectetdTabElement = event.target.parentNode;
            const tabPanels = selectetdTabElement.parentNode.nextSibling;
            const selectedPanelElement = tabPanels.querySelector('#' + tabID);

            // iterate through siblings until none are active.
            const tabs = selectetdTabElement.parentNode;
            for (const tab of [].slice.call(tabs.childNodes)) {
                tab.classList.remove('active');
            }

            selectetdTabElement.classList.add('active');

            // same for panels
            for (const panel of [].slice.call(tabPanels.childNodes)) {
                panel.classList.remove('active', 'in');
            }
            selectedPanelElement.classList.add('active', 'in');
        }

        renderOverview() {
            const isLoading = [null, 'loading'].includes(this.props.set.selectedItem.status);
            return e('div', null, [
                this.renderHeader(),
                // The item area
                e('div', {
                    style: {
                        position: 'relative'
                    }
                }, [
                    isLoading ? e('div', {
                        style: {
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        }
                    }, this.renderLoading(3)) : null,
                    e('div', {
                        style: {
                            minHeight: '5em'
                        }
                    }, this.renderItemTable())
                ])
            ]);
        }

        renderNoItems() {
            return e('div', null, 'Sorry, no items');
        }

        renderLoading(size) {
            const sizeClass = (() => {
                if (size) {
                    return `fa-${size}x`;
                }
                return '';
            })();
            return e('div', {
                style: {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }
            }, e('i', {
                style: {
                    color: 'rgba(150, 150, 150, 1)',
                },
                className: `fa fa-spinner fa-pulse fa-fw ${sizeClass}`
            }));
        }

        renderViewer() {
            return e('div', {
                ref: (x) => {
                    this.tabsRef = x;
                }
            }, [
                e('ul', {
                    className: 'nav nav-tabs',
                    role: "tablist"
                }, [
                    e('li', {
                        role: 'presentation',
                        className: 'active'
                    }, e('a', {
                        href: '#overview',
                        role: 'tab',
                        dataToggle: 'tab',
                        ariaControls: 'overview',
                        onClick: this.clickTab.bind(this)
                    }, 'Overview')),
                    // An example of a second tab.
                    // I have a feeling that tabs will need to move into the
                    // subclass if there is significant divergence.
                    // On the other hand, we may want to start with implementing tabs
                    // for common views across set types - comparison (all instances
                    // of a set in a table), metadata (about the set itself).
                    // Maybe custom visualizations can just be provided as an array 
                    // of tab specs.
                    // h('li', {
                    //     role: 'presentation'
                    // }, h('a', {
                    //     href: '#info',
                    //     role: 'tab',
                    //     dataToggle: 'tab',
                    //     ariaControls: 'info',
                    //     onClick: this.clickTab.bind(this)
                    // }, 'Info'))
                ]),
                e('div', {
                    className: 'tab-content',
                    style: {
                        paddingTop: '10px'
                    }
                }, [
                    e('div', {
                        role: 'tabpanel',
                        className: 'tab-pane fade in active',
                        id: 'overview'
                    }, this.renderOverview()),
                    // An example of a second tab panel area.
                    // h('div', {
                    //     role: 'tabpanel',
                    //     className: 'tab-pane fade',
                    //     id: 'info'
                    // }, 'info here')

                ])
            ]);
        }

        renderState() {
            switch (this.props.set.status) {
                case null:
                case 'loading':
                    return this.renderLoading();
                case 'error':
                    return this.renderError();
                case 'loaded':
                    if (this.props.set.value.items.length === 0) {
                        return this.renderNoItems();
                    } else {
                        return this.renderViewer();
                    }
            }
        }

        render() {
            return e('div', {
                className: 'SetComponent'
            }, this.renderState());
        }
    }

    return SetComponent;
});
