function BitMatrix() { 
		this.getMatrix = function(sites){	
				var length = sites[0].sequence.length;
				var data = [];

				for (var i = 0; i<length; i++) {
					data.push([0,0,0,0]);
				};

				for (var site in sites) {
					var bases = sites[site].sequence.split("");
					for (var i = 0; i < data.length; i++){
						if (bases[i].toLowerCase() == "a"){
							data[i][0]++;
						}
						else if (bases[i].toLowerCase() == "c"){
							data[i][1]++;
						}
						else if (bases[i].toLowerCase() == "g"){
							data[i][2]++;
						}
						else if (bases[i].toLowerCase() == "t"){
							data[i][3]++;
						};
					
					};
				};
				
				for (var i = 0; i<data.length; i++){
					var infContent = 2;
					for (var j = 0; j < 4; j++){
						if (data[i][j] > 0) {
							var freq = data[i][j]/sites.length;
							infContent += freq*Math.log(freq)/Math.log(2);
						};
					};
					for (var j = 0; j < 4; j++){
						if (data[i][j] > 0) {
							data[i][j] = infContent*data[i][j]/sites.length;
						};
					};
				};
				
				var bitMatrix = [];
				for (var i = 0; i < data.length; i++){
					var column = [];
					for (var j = 0; j < 4; j++){
						if (data[i][j] > 0){
							if (j == 0){
								column.push({letter:"A", bits: data[i][j]});
							}
							else if (j == 1){
								column.push({letter:"C", bits: data[i][j]});
							}
							else if (j == 2){
								column.push({letter:"G", bits: data[i][j]});
							}
							else if (j == 3){
								column.push({letter:"T", bits: data[i][j]});
							};
						};
					};
					if (column.length > 1) { //sort
						column.sort(function(a,b) {return (a.bits > b.bits) ? 1 : ((b.bits > a.bits) ? -1 : 0);} );
					};
					bitMatrix.push(column);
				};
				return bitMatrix;
		};
};
