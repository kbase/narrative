function Rectangle(origin,size) {
    if (origin == undefined) {
        origin = new Point(-1,-1);
    }
    if (size == undefined) {
        size = new Size(-1,-1);
    }
    this.origin = origin;
    this.size = size;
}

Rectangle.prototype.invert = function() {
    return new Rectangle(
        this.height,
        this.width
    );
}

Rectangle.prototype.insetRect = function(dx,dy) {
    return new Rectangle(
        new Point(this.origin.x + dx / 2, this.origin.y + dy / 2),
        new Size(this.size.width - dx, this.size.height - dy)
    );
}

Rectangle.prototype.fromString = function (string) {
    var results;
    if (results = string.match(/{{(.+),\s*(.+)},\s*{(.+),\s*(.+)}}/)) {
        return new Rectangle(
            new Point(parseInt(results[1]), parseInt(results[2])),
            new Size(parseInt(results[3]), parseInt(results[4])));
    }
    else {
        return undefined;
    }
}

Rectangle.prototype.intersects = function (r2) {
    if (
        this.origin.x < r2.origin.x + r2.size.width
        && this.origin.x + this.size.width > r2.origin.x
        && this.origin.y < r2.origin.y + r2.size.height
        && this.origin.y + this.size.height > r2.origin.y
        )
        {
            return true;
    }
    else {
        return false;
    }
}

Rectangle.prototype.unionRect = function (r2, padding) {

    var union = new Rectangle();
    union.origin.x = this.origin.x < r2.origin.x ? this.origin.x : r2.origin.x;
    union.origin.y = this.origin.y < r2.origin.y ? this.origin.y : r2.origin.y;
    var thisx2 = this.origin.x + this.size.width;
    var r2x2 = r2.origin.x + r2.size.width;
    
    var unionx2 = thisx2 > r2x2 ? thisx2 : r2x2;
    
    union.size.width = unionx2 - union.origin.x;
    
    var thisy2 = this.origin.y + this.size.height;
    var r2y2 = r2.origin.y + r2.size.height;
    
    var uniony2 = thisy2 > r2y2 ? thisy2 : r2y2;
    
    union.size.height = uniony2 - union.origin.y;

    if (padding != undefined) {
        union.origin.x -= padding;
        union.origin.y -= padding;
        union.size.width += padding * 2;
        union.size.height += padding * 2;
    }

    return union;
}

Rectangle.prototype.containsPoint = function (p) {
    var ux = this.origin.x + this.size.width;
    var uy = this.origin.y + this.size.height;
    if (p.x >= this.origin.x && p.x <= ux
        && p.y >= this.origin.y && p.y <= uy) {
            return true;
    }
    else {
        return false;
    }
}

Rectangle.prototype.equals = function (r2) {
    if (this == undefined || r2 == undefined) {
        return false;
    }
    else {
        return this.origin.x == r2.origin.x
            && this.origin.y == r2.origin.y
            && this.size.width == r2.size.width
            && this.size.height == r2.size.height;
    }
}

Rectangle.prototype.asString = function () {
    return "{" + this.origin.asString() + ", " + this.size.asString() + "}";
}

