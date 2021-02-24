function Point(x,y) {
    this.x = x;
    this.y = y;
}

Point.prototype.asString = function () {
    return "{" + this.x + ", " + this.y + "}";
}

Point.prototype.offset = function(dx, dy) {
    return new Point(this.x + dx, this.y + dy);
}

Point.prototype.rectWithPoint = function(point) {

    const ux = this.x < point.x
        ? this.x
        : point.x;
    const uy = this.y < point.y
        ? this.y
        : point.y;

    const width = Math.abs(this.x - point.x);
    const height = Math.abs(this.y - point.y);

    return new Rectangle(
        new Point(ux, uy),
        new Size (width, height)
    );
}
