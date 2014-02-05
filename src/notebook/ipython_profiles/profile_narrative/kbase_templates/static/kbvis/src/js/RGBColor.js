function RGBColor(r,g,b) {
    this.r = r;
    this.g = g;
    this.b = b;
}

RGBColor.prototype.asString = function () {
    return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
}

RGBColor.prototype.asStringWithAlpha = function (alpha) {
    return "rgba(" + this.r + "," + this.g + "," + this.b + ',' + alpha + ")";
}

RGBColor.prototype.invert = function() {
    return new RGBColor(255 - this.r, 255 - this.g, 255 - this.b);
}

RGBColor.prototype.darkenBy = function(amount) {
    var darker = new RGBColor(this.r,this.g,this.b);

    darker.r -= amount;
    darker.g -= amount;
    darker.b -= amount;

    if (darker.r < 0) {
        darker.r = 0;
    }

    if (darker.g < 0) {
        darker.g = 0;
    }

    if (darker.b < 0) {
        darker.b = 0;
    }

    return darker;
}

RGBColor.prototype.lightenBy = function(amount) {
    var darker = new RGBColor(this.r,this.g,this.b);

    darker.r += amount;
    darker.g += amount;
    darker.b += amount;

    if (darker.r > 255) {
        darker.r = 255;
    }

    if (darker.g > 255) {
        darker.g = 255;
    }

    if (darker.b > 255) {
        darker.b = 255;
    }

    return darker;
}

RGBColor.prototype.subtract = function(c) {
	return new RGBColor(
		this.r - c.r,
		this.g - c.g,
		this.b - c.b
	);
}
