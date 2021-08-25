/* eslint-env browser */
/**
 * Widget for Narrative Outline Panel
 * @author David Lton  <dlyon@lbl.gov>
 * @public
 */
define([
    'jquery',
    'base/js/namespace',
    'kbwidget',
    'kbaseNarrativeControlPanel'
], (
    $,
    Jupyter,
    KBWidget,
    ControlPanel,
) => {
    'use strict';
    return new KBWidget({
        name: 'kbaseNarrativeOutlinePanel',
        parent: ControlPanel,
        version: '1.0.0',
        options: {},
        ws_name: null,
        $mainPanel: null,

        init: function (options) {
            this._super(options);

            this.$mainPanel = $('<div>');
            this.body().append(this.$mainPanel);
            this.$mainPanel.append(
                $('<h5>').text('KBase Narrative Outline')
            )
            const $outline = $('<div>').addClass('kb-narr-outline').appendTo(this.$mainPanel);
            const $outline_ul = $('<ul>').appendTo($outline);
            Jupyter.notebook.get_cells().forEach((cell) => {
                const title = cell.metadata.kbase.attributes.title;
                $outline_ul.append(
                    $('<li>').append(
                        $('<div>').addClass('kb-narr-outline__item').append(
                            $('<a>').text(title).attr('href', '#')
                                .click(() => {
                                    cell.element[0].scrollIntoView();
                                    cell.element[0].click();
                                })
                        )
                    )
                )
            });

            //     this.$mainPanel.html(
            //         `
            //         <h2>
            //             KBase Narrative Outline
            //         </h2>
            //         <div class="kb-narr-outline">
            //             <ul>
            //             <li><span class="kb-narr-outline__item">md Cell with H1</span>
            //                 <ul>
            //                 <li><div class="kb-narr-outline__item">App Cell</div></li>
            //                 <li><div class="kb-narr-outline__item">App Cell</div></li>
            //                 <li><div class="kb-narr-outline__item">App Cell</div></li>
            //                 <li><div class="kb-narr-outline__item"><button>Some chunky thing</button></div>
            //                     <ul>
            //                     <li><span class="kb-narr-outline__item">Another App Cell</span></li></ul></li></ul></li>
            //             <li><span class="kb-narr-outline__item">nother md Cell with H1</span></li>
            //               <li>
            //                 <div class="kb-narr-outline__item">
            //                   <img
            //   src="https://cdn.glitch.com/a9975ea6-8949-4bab-addb-8a95021dc2da%2Fillustration.svg?v=1618177344016"
            //   class="illustration"
            //   alt="Editor illustration"
            //   title="Click the image!"
            // />
            //                 </div>
            //               </li>
            //             </ul>
            //         </div>
            //         `
            //     );

            // the string name of the workspace.
            this.ws_name = Jupyter.narrative.getWorkspaceName();

            $([Jupyter.events]).on('notebook_saved.Notebook', () => {
                this.refresh();
            });

            // doesn't need a title, so just hide it to avoid padding.
            // yes, it's a hack. mea culpa.
            this.$elem.find('.kb-title').hide();
            return this;
        },
    });
});
