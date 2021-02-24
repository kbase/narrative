/**
 * Output widget for visualization of Multiple Sequence Alignment.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
        'narrativeConfig',
		'kbaseAuthenticatedWidget'
	], (
		KBWidget,
		bootstrap,
		$,
        Config,
		kbaseAuthenticatedWidget
	) => {
    return KBWidget({
        name: 'kbaseMSA',
        parent : kbaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            msaID: null,
            workspaceID: null,
            kbCache: null,
            workspaceURL: Config.url('workspace'),
            loadingImage: Config.get('loading_gif'),
            height: null,
        },

        pref: null,
        timer: null,
        loadingImage: Config.get('loading_gif'),
        token: null,
        aminoAcidColors: {
        	//// Pos.charged ////////
        	"K": "#ff8f8f",
        	"R": "#ff8f8f",
        	//// Polar //////////////
        	"S": "#6fff6f",
        	"T": "#6fff6f",
        	"Q": "#6fff6f",
        	"N": "#6fff6f",
        	//// Hydrophobic ////////
        	"L": "#9fcfff",
        	"V": "#9fcfff",
        	"I": "#9fcfff",
        	"A": "#9fcfff",
        	"F": "#9fcfff",
        	"W": "#9fcfff",
        	"M": "#9fcfff",
        	//// Negative ///////////
        	"C": "#ffcfef",
        	//// Negative ///////////
        	"E": "#ff8fff",
        	"D": "#ff8fff",
        	//// Small //////////////
        	"G": "orange",
        	"P": "yellow",
        	//////////////////
        	"H": "#9fffff",
        	"Y": "#9fffff"
        },

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();

            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            if (!this.options.msaID) {
                this.renderError("No MSA to render!");
            } else if (!this.options.workspaceID) {
                this.renderError("No workspace given!");
            } else if (!this.options.kbCache && !this.authToken()) {
                this.renderError("No cache given, and not logged in!");
            } else {
            	this.token = this.authToken();

                this.render();
            }

            return this;
        },

        render: function() {
        	this.wsClient = new Workspace(this.options.workspaceURL, {token: this.token});
            this.loading(false);
            this.loadMSA();
        },

        loadMSA: function() {
            let prom;
            const objId = this.buildObjectIdentity(this.options.workspaceID, this.options.msaID, null, null);
            if (this.options.kbCache)
                prom = this.options.kbCache.req('ws', 'get_objects', [objId]);
            else
                prom = this.wsClient.get_objects([objId]);

            const self = this;

            $.when(prom).done($.proxy((objArr) => {
                self.$elem.empty();
                self.$elem.append(''+
                '<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;">'+
				'<tr><td width="40%">Multiple Sequence Alignment object ID</td><td>'+self.options.msaID+'</td></tr></table>');
                //self.$elem.append("<p>Multiple Sequence Alignment object ID:&nbsp;<b>" + self.options.msaID + "</b></p><br>");
                const canvasId = "canvas-" + self.pref;
                const canvasDivId = "canvas-div-" + self.pref;
                const canvasDiv = $('<div id="' + canvasDivId + '" style="border:1px solid #d3d3d3;">').append($('<canvas id="' + canvasId + '">'));
                canvasDiv.css({'max-height':400, 'max-width':1080, 'overflow':'scroll'});
                self.$elem.append(canvasDiv);
                watchForWidgetMaxWidthCorrection(canvasDivId);
                const canvas = document.getElementById(canvasId);

                const aln = objArr[0].data.alignment;
                let size = 0;
                let len = null;
                let max_lbl_w = 0;
                for (var key in aln) {
                	size++;
                	const lbl_w = self.drawLine(canvas, key, 0, true);
                	if (max_lbl_w < lbl_w)
                		max_lbl_w = lbl_w;
                	len = aln[key].length;
                }

                canvas.width = max_lbl_w + (2 + len) * 8;
            	canvas.height = size * 12 + 2;
                let line = 0;
                for (var key in aln) {
                	self.drawLine(canvas, key, line, false);
                	const seq = aln[key];
                	for (let i = 0; i < seq.length; i++) {
                		const smb = seq.substring(i, i + 1);
                		self.drawSymbol(canvas, smb, self.getColor(smb), max_lbl_w, 2 + i, line);
                	}
                	line++;
                }
                self.loading(true);
            }, this));
            $.when(prom).fail($.proxy(function(error) { this.renderError(error); }, this));
        },

        drawSymbol: function(canvas, smb, color, xshift, xpos, ypos) {
            const text = smb;
            const ctx = canvas.getContext("2d");
            const fontH = 10;
            const fontW = 7;
            const font = fontH + "pt courier-new";
            CanvasTextFunctions.enable(ctx);
            ctx.strokeStyle = "#000000";
            ctx.fillStyle = color;
            const smbW = ctx.measureText(font, fontH, text);
            const x = xshift + xpos * (fontW + 1);
            const y = ypos * (fontH + 2);
            //var h = fontsize;
            ctx.fillRect(x - 1, y + 1, fontW + 1, fontH + 2);
            ctx.drawText(font, fontH, x + (fontW - smbW) / 2, y + fontH * 1.1, text);
        },

        drawLine: function(canvas, text, ypos, dryMode) {
            const ctx = canvas.getContext("2d");
            const fontH = 10;
            const font = fontH + "pt courier-new";
            CanvasTextFunctions.enable(ctx);
            ctx.strokeStyle = "#000000";
            const lineW = ctx.measureText(font, fontH, text);
            const y = ypos * (fontH + 2);
            if (!dryMode)
            	ctx.drawText(font, fontH, 0, y + fontH * 1.1, text);
            return lineW;
        },

        getColor: function(smb) {
        	let ret = this.aminoAcidColors[smb];
        	if (!ret)
        		ret = "#ffffff";
        	return ret;
        },

        renderError: function(error) {
            errString = "Sorry, an unknown error occurred";
            if (typeof error === "string")
                errString = error;
            else if (error.error && error.error.message)
                errString = error.error.message;

            const $errorDiv = $("<div>")
                            .addClass("alert alert-danger")
                            .append("<b>Error:</b>")
                            .append("<br>" + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },

        getData: function() {
            return {
                type: 'MSA',
                id: this.options.msaID,
                workspace: this.options.workspaceID,
                title: 'Multiple sequence alignment'
            };
        },

        buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
            const obj = {};
            if (wsRef) {
            	obj['ref'] = wsRef;
            } else {
            	if (/^\d+$/.exec(workspaceID))
            		obj['wsid'] = workspaceID;
            	else
            		obj['workspace'] = workspaceID;

            	// same for the id
            	if (/^\d+$/.exec(objectID))
            		obj['objid'] = objectID;
            	else
            		obj['name'] = objectID;

            	if (objectVer)
            		obj['ver'] = objectVer;
            }
            return obj;
        },

        loading: function(doneLoading) {
            if (doneLoading)
                this.hideMessage();
            else
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
        },

        showMessage: function(message) {
            const span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
                (c) => {
                    const r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        },

        loggedInCallback: function(event, auth) {
        	if (this.token == null) {
        		this.token = auth.token;
        		this.render();
        	}
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.render();
            return this;
        }

    });
});
