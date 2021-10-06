define([
    'react',
    'react_components/ErrorMessage',

    // For effect
    'bootstrap',
    'css!./SetBrowser.css'
], (
    React,
    ErrorMessage
) => {
    'use strict';

    const { createElement: e, Component } = React;

    class SetBrowser extends Component {
        constructor(props) {
            super(props);
        }

        renderError() {
            return e(ErrorMessage, {
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
            }, ...content);
        }

        renderSelector() {
            return [
                e('div', {
                    className: 'Col',
                }, 'Select alignment to view:'),
                e('div', {
                    className: 'form-inline Col',
                }, e('div', { className: 'form-group' }, e('select', {
                    onChange: this.selectItem.bind(this),
                    className: 'form-control',
                    style: {
                        marginLeft: '0',
                        marginRight: '0',
                        padding: '4px'
                    }
                }, this.props.set.value.items.map(({ label, ref, objectInfo }) => {
                    if (label) {
                        return e('option', { value: ref, key: ref }, objectInfo.name, ' (', label, ')');
                    } else {
                        return e('option', { value: ref, key: ref }, objectInfo.name);
                    }
                }))
                ))
            ];
        }

        renderHeader() {
            return e('div', {
                className: 'Table',
            }, ...[
                e('div', {
                    className: 'Row',
                }, ...[
                    e('div', {
                        className: 'Col',
                    }, 'Description:'),
                    e('div', {
                        className: 'Col',
                    }, this.props.set.value.description)
                ]),
                e('div', {
                    className: 'Row',
                }, ...[
                    e('div', {
                        className: 'Col',
                    }, 'Alignment type:'),
                    e('div', {
                        className: 'Col',
                    }, this.renderItemType())
                ]),
                e('div', {
                    className: 'Row',
                }, ...this.renderSelector()),
            ]);
        }

        renderItemTable() {
            throw new Error('renderItemTable not implemented in subclass');
        }

        renderOverview() {
            const isLoading = [null, 'loading'].includes(this.props.set.selectedItem.status);
            return e('div', { key: 'overview' }, ...[
                this.renderHeader(),
                // The item area
                e('div', {
                    style: {
                        position: 'relative'
                    }
                }, ...[
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
            return this.renderOverview();
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
                className: 'SetBrowser'
            }, this.renderState());
        }
    }

    return SetBrowser;
});
