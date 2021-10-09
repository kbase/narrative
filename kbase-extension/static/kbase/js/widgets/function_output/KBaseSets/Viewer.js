define([
    'react',
    'react_components/ErrorMessage',

    // For effect
    'bootstrap',
    'css!./Viewer.css'
], (
    React,
    ErrorMessage
) => {
    'use strict';

    const { createElement: e, Component } = React;

    /**
     * A class implementing the base behavior for a browser for any set type
     * in the KBaseSets type module.
     * 
     * It is an "abstract" class. Subclasses must implement methods in the abstract
     * section below.
     * 
     * 
     */

    class Viewer extends Component {
        // Abstract

        /**
         * Renders a set element as a rotated table of summary properties.
         * Must be implemented by a subclass.
         * @abstract
         * @returns {void} nothing useful
         */
        renderSetElement() {
            throw new Error('renderSetElement not implemented in subclass');
        }

        // Implementation

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
            const isLoading = [null, 'loading'].includes(this.props.set.selectedItem.status);
            return e('div', { key: 'overview', className: 'Overview' }, ...[
                this.renderHeader(),
                // A classic display-relative overlay area, in which the loading spinner 
                // may be temporarily rendered.
                e('div', {
                    className: 'OverlayWrapper'
                }, ...[
                    this.renderSetElement(),
                    isLoading ? this.renderLoading(3) : null
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
                className: 'KBaseSets'
            }, this.renderState());
        }
    }

    return Viewer;
});
