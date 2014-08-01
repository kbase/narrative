function Logo(totalHeight, totalWidth, sites) {
    var margin = {top: 20, right: 20, bottom: 20, left: 30},
    width = totalWidth - margin.left - margin.right,
            height = totalHeight - margin.top - margin.bottom;

    var yAxisTickNames = [];
    for (var i = 0; i < sites[0].length; i++) {
        yAxisTickNames.push(" " + (i + 1).toString() + " "); //MAGIC! position number without surrounding spaces do not work
    }
    ;

    var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
            .range([height, 0]);

    var xAxis = d3.svg.axis()
            .scale(x)
            .tickValues(yAxisTickNames)
            .orient("bottom");

    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

    var svg = d3.select("#motif-logo").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var bitMatrix = new BitMatrix();

    var data = bitMatrix.getMatrix(sites);

    data.forEach(function(d) {
        var y0 = 0;
        d.bits = d.map(function(entry) {

            return {bits: entry.bits, letter: entry.letter, y0: y0, y1: y0 += +entry.bits};
        }
        );
        d.bitTotal = d.bits[d.bits.length - 1].y1;
    });

    x.domain(data.map(function(d, i) {
        return i;
    }));

    var maxBits = d3.max(data, function(d) {
        return d.bitTotal;
    });

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

    var letterWidth = 220,
            letterHeight = 290;

    var column = svg.selectAll(".sequence-column")
            .data(data)
            .enter()
            .append("g")
            .attr("transform", function(d, i) {
                return "translate(" + (x(i) + (x.rangeBand() / (2 * letterWidth))) + ",0)";
            })
            .attr("class", "sequence-column");

    column
            .selectAll("images")
            .data(function(d) {
                return d.bits;
            })
            .enter()
            .append("svg:image")
            .attr("xlink:href", function(e) {
                if (e.letter === "A") {
                    return "assets/img/a.gif";
                }
                if (e.letter === "C") {
                    return "assets/img/c.gif";
                }
                if (e.letter === "G") {
                    return "assets/img/g.gif";
                }
                if (e.letter === "T") {
                    return "assets/img/t.gif";
                }
                ;
            })
            .attr("width", 220)
            .attr("height", 290)
            .attr("y", function(e) {
                return (y(e.y0) * letterHeight) / (y(e.y0) - y(e.y1)) - letterHeight;
            })
            .text(function(e) {
                return e.letter;
            })
            .attr("transform", function(e) {
                return "scale(" + (x.rangeBand() / letterWidth) + "," + ((y(e.y0) - y(e.y1)) / letterHeight) + ")";
            });

}

function BitMatrix() {
    this.getMatrix = function(sites) {
        var length = sites[0].length;
        var data = [];

        for (var i = 0; i < length; i++) {
            data.push([0, 0, 0, 0]);
        }
        ;

        for (var site in sites) {
            var bases = sites[site].split("");
            for (var i = 0; i < data.length; i++) {
                if (bases[i].toLowerCase() === "a") {
                    data[i][0]++;
                }
                else if (bases[i].toLowerCase() === "c") {
                    data[i][1]++;
                }
                else if (bases[i].toLowerCase() === "g") {
                    data[i][2]++;
                }
                else if (bases[i].toLowerCase() === "t") {
                    data[i][3]++;
                }
                ;

            }
            ;
        }
        ;

        for (var i = 0; i < data.length; i++) {
            var infContent = 2;
            for (var j = 0; j < 4; j++) {
                if (data[i][j] > 0) {
                    var freq = data[i][j] / sites.length;
                    infContent += freq * Math.log(freq) / Math.log(2);
                }
                ;
            }
            ;
            for (var j = 0; j < 4; j++) {
                if (data[i][j] > 0) {
                    data[i][j] = infContent * data[i][j] / sites.length;
                }
                ;
            }
            ;
        }
        ;

        var bitMatrix = [];
        for (var i = 0; i < data.length; i++) {
            var column = [];
            for (var j = 0; j < 4; j++) {
                if (data[i][j] > 0) {
                    if (j === 0) {
                        column.push({letter: "A", bits: data[i][j]});
                    }
                    else if (j === 1) {
                        column.push({letter: "C", bits: data[i][j]});
                    }
                    else if (j === 2) {
                        column.push({letter: "G", bits: data[i][j]});
                    }
                    else if (j === 3) {
                        column.push({letter: "T", bits: data[i][j]});
                    }
                    ;
                }
                ;
            }
            ;
            if (column.length > 1) { //sort
                column.sort(function(a, b) {
                    return (a.bits > b.bits) ? 1 : ((b.bits > a.bits) ? -1 : 0);
                });
            }
            ;
            bitMatrix.push(column);
        }
        ;
        return bitMatrix;
    };
}
;
