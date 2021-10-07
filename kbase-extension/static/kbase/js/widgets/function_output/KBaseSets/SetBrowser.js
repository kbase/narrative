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

        renderItemType() {
            // Note that the type is set when the set is first loaded, and will be
            // null if there are no set items. The type is derived from the object
            // referred to by a set item.
            if (this.props.set.value.type === null) {
                return e('i', null, 'n/a');
            } else {
                return e('a', {
                    href: `/#spec/type/${this.props.set.value.type}`,
                    target: '_blank'
                }, this.props.set.value.type);
            }
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
                    className: 'form-control'
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
            // const isLoading = true;
            return e('div', { key: 'overview', className: 'Overview' }, ...[
                this.renderHeader(),
                // The item area
                e('div', {
                    className: 'OverlayWrapper'
                }, ...[
                    this.renderItemTable(),
                    isLoading ? this.renderLoading(3) : null
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
                className: 'LoadingOverlay'
            }, e('i', {
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
