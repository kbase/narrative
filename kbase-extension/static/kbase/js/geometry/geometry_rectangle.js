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

Rectangle.prototype.area = function area () {
    return this.size.width * this.size.height;
}

Rectangle.prototype.invert = function invert () {
    return new Rectangle(
        this.height,
        this.width
    );
}

Rectangle.prototype.lowerRight = function lowerRight () {
    return new Point(
        this.origin.x + this.size.width,
        this.origin.y + this.size.height
    )
}

Rectangle.prototype.insetRect = function insetRect (dx,dy) {
    return new Rectangle(
        new Point(this.origin.x + dx / 2, this.origin.y + dy / 2),
        new Size(this.size.width - dx, this.size.height - dy)
    );
}

Rectangle.prototype.fromString = function fromString (string) {
    let results;
    if (results = string.match(/{{(.+),\s*(.+)},\s*{(.+),\s*(.+)}}/)) {
        return new Rectangle(
            new Point(parseInt(results[1]), parseInt(results[2])),
            new Size(parseInt(results[3]), parseInt(results[4])));
    }
    else {
        return undefined;
    }
}

Rectangle.prototype.intersects = function intersects (r2) {
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

Rectangle.prototype.unionRect = function unionRect (r2, padding) {

    const union = new Rectangle();

    const myLL = this.lowerRight();
    const r2LL = r2.lowerRight();

    union.origin.x = Math.min(this.origin.x, r2.origin.x);
    union.origin.y = Math.min(this.origin.y, r2.origin.y);

    const rightX = Math.max(myLL.x, r2LL.x);
    const rightY = Math.max(myLL.y, r2LL.y);

    union.size.width = union.origin.x + rightX;
    union.size.height = union.origin.Y + rightY;

    if (padding != undefined) {
        union.origin.x -= padding;
        union.origin.y -= padding;
        union.size.width += padding * 2;
        union.size.height += padding * 2;
    }

    return union;

}

Rectangle.prototype.isValidRect = function isValidRect () {
    if (
           isNaN(this.origin.x)
        || isNaN(this.origin.y)
        || isNaN(this.size.width)
        || isNaN(this.size.height) ) {
            return false;
    }
    else {
        return true;
    }
}

Rectangle.prototype.intersectRect = function intersectRect (r2) {

    const intersect = new Rectangle();

    const myLL = this.lowerRight();
    const r2LL = r2.lowerRight();

    intersect.origin.x = Math.max(this.origin.x, r2.origin.x);
    intersect.origin.y = Math.max(this.origin.y, r2.origin.y);

    const rightX = Math.min(myLL.x, r2LL.x);
    const rightY = Math.min(myLL.y, r2LL.y);

    intersect.size.width = rightX - intersect.origin.x;
    intersect.size.height = rightY - intersect.origin.y;

    if (intersect.size.width <= 0) {
        intersect.size.width = Number.NaN;
    }

    if (intersect.size.height <= 0) {
        intersect.size.height = Number.NaN;
    }

    return intersect;

}

Rectangle.prototype.containsPoint = function containsPoint (p) {
    const ux = this.origin.x + this.size.width;
    const uy = this.origin.y + this.size.height;
    if (p.x >= this.origin.x && p.x <= ux
        && p.y >= this.origin.y && p.y <= uy) {
            return true;
    }
    else {
        return false;
    }
}

Rectangle.prototype.equals = function equals (r2) {
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

Rectangle.prototype.asString = function asString () {
    return "{" + this.origin.asString() + ", " + this.size.asString() + "}";
}

