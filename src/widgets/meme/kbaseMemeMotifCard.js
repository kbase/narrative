(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseMemeMotifCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "MEME Motif",
            isInCard: false,
            width: 700
        },

        init: function(options) {
            this._super(options);
            if (this.options.motif === null) {
                //throw an error
                return;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            return this.render();
        },

        render: function(options) {

            var self = this;
            self.motif = this.options.motif;
			self.$elem.append($("<div />")
				.append("<h2>Motif " + self.motif.id + "</h2>"));
			
            self.$elem.append($("<div />")
						.append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>")
					    	.append("<td>Motif description</td><td>" + self.motif.description + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Motif width</td><td>" + self.motif.width + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of sites</td><td>" + self.motif.sites.length + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Motif E-value</td><td>" + self.motif.evalue + "</td>"))
			));

			//Logo 
			var margin = {top: 20, right: 20, bottom: 20, left: 30},
			    width = 700 - margin.left - margin.right,
			    height = 350 - margin.top - margin.bottom;

			var x = d3.scale.ordinal()
	   			.rangeRoundBands([0, width], .1);

			var y = d3.scale.linear()
			    .range([height, 0]);

			var xAxis = d3.svg.axis()
			    .scale(x)
			    .orient("bottom");

			var yAxis = d3.svg.axis()
			    .scale(y)
			    .orient("left");


			self.$elem.append($("<div />")
						.attr("id","motif-logo"));
						
			var svg = d3.select("#motif-logo").append("svg")
						.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom)
						.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


			sequencelogoFont();
			
			var bitMatrix = new BitMatrix();

			var data = bitMatrix.getMatrix(self.motif.sites);

			data.forEach(function(d) {
				var y0 = 0;
				d.bits = d.map( function( entry ) { 

					return { bits: entry.bits, letter: entry.letter, y0: y0, y1 : y0 += +entry.bits };  		
				    }  
				)
				d.bitTotal = d.bits[d.bits.length - 1].y1; 
			});

			x.domain( data.map( function(d,i) { return i; } ) );

			var maxBits = d3.max( data, function( d ) { return d.bitTotal } );

			y.domain([0, maxBits]);

			svg.append("g")
  			.attr("class", "x memelogo-axis")
			  .attr("transform", "translate(0," + height + ")")
			  .call(xAxis);

			svg.append("g")
  			.attr("class", "y memelogo-axis")
			  .call(yAxis)
			.append("text")
			  .attr("transform", "rotate(-90)")
			  .attr("y", 6)
			  .attr("dy", ".21em")
  			.style("text-anchor", "end")
			  .text("Bits");

			var letterWidth = 1;

			var browserName = (function(){
			  var N= navigator.appName, ua= navigator.userAgent, tem;
			  var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
			  if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
			  M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
			  return M;
			 })(); 
//		document.write(browserName);	
			if (browserName.toString().match(/Firefox/i)) {letterWidth = x.rangeBand()};

			var column = svg.selectAll(".sequence-column")
			  .data(data)
				.enter()
				.append("g")
				.attr("transform", function(d, i) { return "translate(" + (x(i) + (x.rangeBand() / 2)) + ",0)"; })
				.attr("class", "sequence-column");

			column
				.selectAll("text")
				.data( function(d) { return d.bits; })
				.enter()
				.append("text")
					.attr("y", function(e) { return y(e.y0)/(y(e.y0) - y(e.y1)); })
					.text( function(e) { return e.letter; } )
					.attr("class", function(e) { return "memelogo-letter-" + e.letter; } )
					.style( "text-anchor", "middle" )
					.style( "font-family", "sequencelogo" )
					.attr( "transform", function(e) {return "scale(" + letterWidth + "," + (y(e.y0) - y(e.y1)) + ")"})
					.attr( "textLength", x.rangeBand() )
					.attr( "lengthAdjust", "spacingAndGlyphs" )
					.attr( "font-size", "1.37")
					.style( "font-size", "1.37")

			function sequencelogoFont(){
				var font = svg.append("defs").append("font")
				 	.attr("id","sequencelogo") 
					.attr("horiz-adv-x","1000")
					.attr("vert-adv-y","1000")

				font.append("font-face")
					.attr("font-family","sequencelogo") 
					.attr("units-per-em","1000") 
					.attr("ascent","950") 
					.attr("descent","-50")

				font.append("glyph")
					.attr("unicode","A") 
					.attr("vert-adv-y","50") 
					.attr("d","M500 767l-120 -409h240zM345 948h310l345 -1000h-253l-79 247h-338l-77 -247h-253l345 1000v0z") 

				font.append("glyph")
					.attr("unicode","C") 
					.attr("vert-adv-y","50") 
					.attr("d","M1000 -6q-75 -23 -158 -34.5t-175 -11.5q-325 0 -496 128.5t-171 370.5q0 244 171 372.5t496 128.5q92 0 176 -12t157 -35v-212q-82 46 -159 66q-77 22 -159 22q-174 0 -263 -84q-89 -82 -89 -246q0 -162 89 -246q89 -82 263 -82q82 0 159 20q77 22 159 67v-212v0z") 

				font.append("glyph")
					.attr("unicode","G") 
					.attr("vert-adv-y","50") 
					.attr("d","M745 141v184h-199v160h454v-442q-84 -47 -186 -71q-100 -24 -216 -24q-286 0 -442 129q-156 131 -156 370q0 244 157 372q158 129 455 129q89 0 175 -17q86 -16 161 -47v-211q-62 51 -141 77q-79 27 -174 27q-166 0 -248 -82t-82 -248q0 -160 79 -244t230 -84q45 0 79 5 q34 6 54 17v0z") 

				font.append("glyph")
					.attr("unicode","T") 
					.attr("vert-adv-y","50") 
					.attr("d","M640 -52h-280v827h-360v173h1000v-173h-360v-827v0z") 

				font.append("glyph")
					.attr("unicode","U") 
					.attr("vert-adv-y","50") 
					.attr("d","M0 329v619h289v-668q0 -73 56 -116q56 -41 155 -41t155 41q56 43 56 116v668h289v-619q0 -200 -118.5 -290.5t-381.5 -90.5q-262 0 -381 90q-119 91 -119 291v0z") 

				font.append("glyph")
					.attr("unicode","L") 
					.attr("vert-adv-y","50") 
					.attr("d","m 1.6989409e-6,-52.3624 0,1000.00001 318.5745983010591,0 0,-825.8544 681.42537,0 0,-174.14561 -999.9999683010586,0") 

				font.append("glyph")
					.attr("unicode","V") 
					.attr("vert-adv-y","50") 
					.attr("d","m 499.5532,112.40591 235.03143,835.2317 265.41534,0 L 682.7517,-52.3624 l -365.5047,0 L 1.6989409e-6,947.63761 265.4153,947.63761 499.5532,112.40591") 

				font.append("glyph")
					.attr("unicode","I") 
					.attr("vert-adv-y","50") 
					.attr("d","m -1.3301059e-5,773.49201 0,174.1456 1000.000003301059,0 0,-174.1456 -334.0831,0 0,-651.7088 334.0831,0 0,-174.14561 -1000.000003301059,0 0,174.14561 334.083103301059,0 0,651.7088 -334.083103301059,0") 

				font.append("glyph")
					.attr("unicode","P") 
					.attr("vert-adv-y","50") 
					.attr("d","m 299.49259,781.52901 0,-293.3695 122.8425,0 c 98.1377,0 166.8346,10.9396 206.0909,32.8207 39.9319,21.8792 59.8979,59.8334 59.8993,113.8646 0,54.0292 -19.9674,91.9834 -59.8993,113.8645 -39.2563,21.8792 -107.9532,32.8188 -206.0909,32.8197 l -122.8425,0 M -1.3301059e-5,947.63761 411.16809,947.63761 c 209.136,-9e-4 359.3891,-24.5597 450.7608,-73.6774 92.0459,-49.1186 138.0696,-128.8241 138.0711,-239.1154 0,-110.2933 -46.0252,-189.9988 -138.0711,-239.1164 -91.3717,-49.1186 -241.6248,-73.6775 -450.7608,-73.6775 l -111.6755,0 0,-374.41331 -299.492603301059,0 0,1000.00001") 

				font.append("glyph")
					.attr("unicode","F") 
					.attr("vert-adv-y","50") 
					.attr("d","m 999.99999,773.49201 -682.7959,0 0,-215.674 621.5058,0 0,-174.1457 -621.5058,0 0,-436.03471 -317.204104951589,0 0,1000.00001 1000.000004951589,0 0,-174.1456") 

				font.append("glyph")
					.attr("unicode","S") 
					.attr("vert-adv-y","50") 
					.attr("d","m 388.37859,389.21222 c -151.5458,36.583 -254.1619,74.8866 -307.848305,114.9135 -53.6878,40.4558 -80.530299951589,94.6838 -80.530299951589,162.6851 0,87.3679 44.171599951589,156.0138 132.517604951589,205.9394 88.3446,49.9237 209.6497,74.8856 363.9152,74.8874 69.9949,0 139.9926,-5.1664 209.9889,-15.4938 69.9963,-9.9005 139.3127,-24.7489 207.952,-44.5452 l 0,-185.9264 c -64.5611,28.8347 -130.14,50.785 -196.738,65.8492 -66.5995,15.0623 -132.519,22.5939 -197.7572,22.5948 -72.7161,-9e-4 -128.4423,-9.254 -167.1772,-27.7594 -38.7364,-18.5073 -58.1039,-44.9768 -58.1039,-79.4067 0,-26.6843 13.9309,-48.8495 41.794,-66.4946 28.5416,-17.2154 87.6646,-36.3681 177.3705,-57.4563 l 129.4601,-30.9877 c 122.3228,-28.4059 212.3665,-66.064 270.1325,-112.9762 57.7632,-46.9122 86.6455,-106.09 86.6455,-177.5335 0,-97.2675 -45.5329,-170.0018 -136.5944,-218.205 -90.3858,-47.77252 -227.3209,-71.65922 -410.8065,-71.65922 -75.433,0 -151.2066,5.8101 -227.3195,17.4303 C 149.84669,-23.7417 76.791385,-6.9569 6.116585,15.42312 l 0,196.9011 c 80.1896,-36.1524 157.660905,-63.0515 232.415405,-80.6966 75.4329,-17.6461 149.8466,-26.4695 223.2412,-26.4695 74.0745,0 131.4984,10.545 172.2746,31.6341 40.7733,21.5188 61.16,51.4304 61.1614,89.7349 0,28.8356 -13.593,54.0132 -40.7747,75.5329 -27.1832,21.9485 -66.5995,39.1639 -118.2461,51.6462 l -147.8098,35.506") 

				font.append("glyph")
					.attr("unicode","Y") 
					.attr("vert-adv-y","50") 
					.attr("d","m -1.3301059e-5,947.63761 261.297403301059,0 238.2918,-401.8756 239.1122,401.8756 261.2986,0 -378.8008,-606.1623 0,-393.83771 -242.3996,0 0,393.83771 L -1.3301059e-5,947.63761") 

				font.append("glyph")
					.attr("unicode","N") 
					.attr("vert-adv-y","50") 
					.attr("d","m 6.6989408e-6,947.63763 319.2338033010592,0 418.93256,-726.72457 0,726.72457 261.8336,0 0,-1000.00003 -317.2215,0 -420.94631,726.72458 0,-726.72458 -261.8321533010589,0 0,1000.00003") 

				font.append("glyph")
					.attr("unicode","Q") 
					.attr("vert-adv-y","50") 
					.attr("d","m 537.65569,90.89181 c -8.8981,-1.111 -16.5244,-1.851 -22.879,-2.2213 -5.7214,-0.7423 -11.4401,-1.1103 -17.1602,-1.1103 -163.3305,0 -287.2577,36.2757 -371.7817,108.8279 -83.889403,72.5523 -125.834803301059,179.53 -125.834803301059,320.9332 0,141.772 41.945400301059,248.9346 125.834803301059,321.4876 84.524,72.55141 209.0871,108.82721 373.6893,108.8287 165.2354,0 289.7985,-36.27729 373.6893,-108.8287 84.5239,-72.553 126.7852,-179.7156 126.7866,-321.4876 0,-97.3538 -20.0196,-178.9748 -60.0574,-244.8637 -40.0392,-65.5193 -98.1889,-112.3452 -174.4507,-140.4777 L 942.80329,30.92481 750.23929,-52.3624 537.65569,90.89181 m -38.1316,709.6048 c -71.8148,0 -124.2458,-22.3955 -157.2932,-67.1848 -33.0473,-44.4197 -49.5717,-116.4168 -49.5703,-215.9905 0,-99.2048 16.523,-171.2019 49.5703,-215.9912 33.0474,-44.4198 85.4784,-66.6296 157.2932,-66.6296 72.4493,0 125.1976,22.2098 158.245,66.6296 33.0473,44.7893 49.5703,116.7864 49.5717,215.9912 0,99.5737 -16.5244,171.5708 -49.5717,215.9905 -33.0474,44.7893 -85.7957,67.1848 -158.245,67.1848") 

				font.append("glyph")
					.attr("unicode","D") 
					.attr("vert-adv-y","50") 
					.attr("d","m 293.82509,769.47301 0,-643.6708 79.6813,0 c 115.5372,0 197.8746,24.335 247.0121,73.0069 49.1361,49.1186 73.7035,132.3953 73.7049,249.833 0,116.5433 -24.5688,199.1513 -73.7049,247.8231 -49.1375,48.6709 -131.4749,73.0068 -247.0121,73.0078 l -79.6813,0 M -1.4951589e-5,947.63761 314.74049,947.63761 c 243.0274,-9e-4 417.9948,-39.0716 524.901,-117.2138 106.9047,-77.6965 160.3571,-204.9573 160.3585,-381.7817 0,-177.272 -53.4538,-305.2026 -160.3585,-383.7916 C 732.73529,-13.2917 557.76789,-52.3624 314.74049,-52.3624 l -314.740504951589,0 0,1000.00001") 

				font.append("glyph")
					.attr("unicode","E") 
					.attr("vert-adv-y","50") 
					.attr("d","m 999.99999,-52.3624 -1000.000003301059,0 0,1000.00001 1000.000003301059,0 0,-174.1456 -682.7954,0 0,-215.674 618.2785,0 0,-174.1457 -618.2785,0 0,-261.8891 682.7954,0 0,-174.14561")

				font.append("glyph")
					.attr("unicode","R") 
					.attr("vert-adv-y","50") 
					.attr("d","m 612.72783,419.84141 c 26.66536,-4.02 49.695,-13.3963 69.09022,-28.132 19.99902,-14.2889 44.24142,-42.42 72.72722,-84.3932 l 245.4547,-359.67861 -294.5459,0 -163.6356,252.51181 c -4.84978,7.1435 -11.21357,16.9676 -19.09139,29.4704 -47.87972,75.4635 -104.24235,113.1948 -169.09047,113.1948 l -85.45481,0 0,-395.17701 -268.1817983010593,0 0,1000.00001 387.2734383010593,0 c 174.54404,-9e-4 299.69564,-22.7736 375.45348,-68.3191 76.36294,-45.5464 114.54441,-119.6696 114.5457,-222.3707 -10e-4,-68.7659 -22.72839,-123.4657 -68.18129,-164.0996 -45.45548,-40.6338 -110.90998,-64.9698 -196.3635,-73.0068 m -344.54603,361.6876 0,-272.6058 126.36436,0 c 73.33231,0 125.75668,10.4929 157.27181,31.4804 32.12022,21.4334 48.18098,56.485 48.18227,105.1578 -10e-4,48.6709 -15.75821,83.4997 -47.27334,104.4872 -31.51513,20.9866 -84.24204,31.4795 -158.18074,31.4804 l -126.36436,0")

				font.append("glyph")
					.attr("unicode","K") 
					.attr("vert-adv-y","50") 
					.attr("d","m 1.6989408e-6,947.63761 266.2454683010592,0 0,-395.1779 416.96755,395.1779 301.44416,0 -425.09012,-393.8376 440.43291,-606.16241 -296.02868,0 -319.49405,450.10081 -118.23177,-111.1859 0,-338.91491 -266.245468301059,0 0,1000.00001")

				font.append("glyph")
					.attr("unicode","H") 
					.attr("vert-adv-y","50") 
					.attr("d","m -1.3301059e-5,947.63761 307.612303301059,0 0,-381.1119 384.7755,0 0,381.1119 307.6122,0 0,-1000.00001 -307.6122,0 0,444.74241 -384.7755,0 0,-444.74241 -307.612303301059,0 0,1000.00001")

				font.append("glyph")
					.attr("unicode","W") 
					.attr("vert-adv-y","50") 
					.attr("d","m 1.6989408e-6,947.63761 209.2454683010592,0 86.77979,-734.0929 104.62274,474.8835 198.70281,0 121.65481,-474.8835 68.12595,734.0929 210.8684,0 -139.49775,-1000.00001 -223.03285,0 -137.87483,525.11751 -128.95393,-525.11751 -221.41108,0 L 1.6989408e-6,947.63761")

				font.append("glyph")
					.attr("unicode","M") 
					.attr("vert-adv-y","50") 
					.attr("d","m 1.198941e-6,947.63761 331.762308801059,0 167.76718,-438.7144 166.8235,438.7144 333.64698,0 0,-1000.00001 -239.397,0 0,801.07171 -148.91503,-437.3751 -221.48988,0 -150.80106,437.3751 0,-801.07171 -239.3969988010592,0 0,1000.00001")
													
			};


		
			//Sites
			self.$elem.append($("<div />")
				.append("<h3>List of sites</h3>"));

			var $sitesTable = '<table id="sites-table' + self.motif.id + '" class="kbgo-table">';
			$sitesTable += "<tr><td>Sequence ID</td><td>Start</td><td>p-value</td><td>&nbsp;</td><td>Site sequence</td><td>&nbsp;</td></tr>";

			for (var site in self.motif.sites) {
				$sitesTable+= "<tr><td>" + self.motif.sites[site].source_sequence_id + "</td><td>" + self.motif.sites[site].start + "</td><td>" + self.motif.sites[site].pvalue + "</td><td>" + self.motif.sites[site].left_flank + "</td><td>" + self.motif.sites[site].sequence + "</td><td>" + self.motif.sites[site].right_flank + "</td></tr>";
			}
			
			$sitesTable+= "</table>";
			self.$elem.append($("<div />").append($sitesTable));
			
            return this;
        },

        getData: function() {
            return {
                type: "MemeRunResult",
                id: this.options.meme_run_result_id,
                workspace: this.options.workspace_id,
                title: "MEME Motif"
            };
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },

        rpcError: function(error) {
            console.log("An error occurred: " + error);
        }
	
    });
})( jQuery );



