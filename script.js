// Initialize all dom references
const Dom = {
    body: document.querySelector("body"),
    canvas: document.querySelector("#canvas"),
    settings: {
        width: document.querySelector("#setting_container #input_width"),
        height: document.querySelector("#setting_container #input_height"),
    }
};

// Curve controler
function Curve () {

    this.ctx = Dom.canvas.getContext("2d");
    
    // Initialize settings
    Dom.canvas.setAttribute("onmousedown", "curve.mouseDown(event)");
    Dom.canvas.setAttribute("onmouseup", "curve.mouseUp(event)");
    Dom.canvas.setAttribute("onmousemove", "curve.mouseMove(event)");
    Dom.settings.width.setAttribute("onchange", "curve.setSize(this.value, curve.height)");
    Dom.settings.height.setAttribute("onchange", "curve.setSize(curve.width, this.value)");

    this.ondrag = false;
    this.mouse_position = {x: 0, y:0};
    this.point_size = 10;
    this.curve_points = [
        {
            a: {x: 10, y: 10, is_select: false}, 
            b: {x: 50, y: 100, is_select: false},
            c: {x: 300, y: 200, is_select: false}, 
            d: {x: 480, y: 20, is_select: false}
        }
    ];

    // Initialize interface
    this.setSize(500,230);
}

Curve.prototype.checkPoint = function (x, y) {
    
    let s = this.point_size/2.0;
    let t = (c) => x >= c.x - s && x <= c.x + s && 
        y >= c.y - s && y <= c.y + s && this.setSelect(c);
    let find_point = false;
    this.curve_points.forEach(p => {
        if(t(p.a) + t(p.b) + t(p.c) + t(p.d) > 0) {
            find_point = true;
        }
    });
    return find_point;
}

Curve.prototype.setSelect = function (p, v) {
    p.is_select = (v == null)? true : v;
    return true;
}

Curve.prototype.mouseDown = function (e) {
    let x = e.offsetX / Dom.canvas.offsetWidth * this.width;
    let y = e.offsetY / Dom.canvas.offsetHeight * this.height;
    this.checkPoint(x, y);
    this.ondrag = true;
    this.mouse_position = {x: x, y:y};
    this.refresh();
}

Curve.prototype.mouseUp = function (e) {
    let x = e.offsetX / Dom.canvas.offsetWidth * this.width;
    let y = e.offsetY / Dom.canvas.offsetHeight * this.height;
    if(!this.checkPoint(x, y)) {
        this.curve_points.forEach(p =>
            this.setSelect(p.a, false) + 
            this.setSelect(p.b, false) + 
            this.setSelect(p.c, false) + 
            this.setSelect(p.d, false));
        this.refresh();
    }
    this.ondrag = false;
}

Curve.prototype.mouseMove = function (e) {
    if(this.ondrag) {

        let new_mouse_position = {
            x : e.offsetX / Dom.canvas.offsetWidth * this.width,
            y : e.offsetY / Dom.canvas.offsetHeight * this.height,
        };
        let delta = {
            x : new_mouse_position.x - this.mouse_position.x,
            y : new_mouse_position.y - this.mouse_position.y,
        }
        let m = (c) => {if(c.is_select){c.x += delta.x; c.y += delta.y}};
                
        this.curve_points.forEach(p => {
            m(p.a); m(p.b); m(p.c); m(p.d);
        });

        this.mouse_position = new_mouse_position;
        this.refresh();
    }
    
}

Curve.prototype.setSize = function (x, y) {

    this.width = x;
    this.height = y;
    Dom.canvas.setAttribute("width", this.width);
    Dom.canvas.setAttribute("height", this.height);
    Dom.settings.width.value = this.width;
    Dom.settings.height.value = this.height;

    // Refresh drawing
    this.refresh();

    console.log("Size update to (" + x + ", " + y + ")");
}

Curve.prototype.draw_gradient_circle = function(x, y, r) {
    var grd = this.ctx.createLinearGradient(x-r, y, x+r, y);
    grd.addColorStop(0, "purple");
    grd.addColorStop(0.5, "pink");
    grd.addColorStop(1, "yellow");
    
    this.ctx.strokeStyle = "transparent";
    this.ctx.fillStyle = grd;

    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    this.ctx.fill();
}

Curve.prototype.bresenham = function (x0, y0, x1, y1) {

    if (Math.abs(y0 - y1) > Math.abs(x0 - x1))
        [x0, y0, x1, y1] = [y0, x0, y1, x1];
   
    if (x0 > x1)
        [x0, y0, x1, y1] = [x1, y1, x0, y0];
        
    [dx, dy] = [Math.abs(x0 - x1), Math.abs(y0 - y1)];
    var dz = (y0 <= y1)? 1 : -1;
    var p = 2 * dy - dx;

    while(x0 <= x1) {
        this.draw_gradient_circle(x0, y0, 10);
        if(p > 0) {
            p -= 2 * dx
            y0 += dz
        }
        p += 2 * dy
        x0 += 1
    }
}


Curve.prototype.draw_bezier = function (p0, p1, p2, p3) {
    
    var t = 0.01;
    
    let l = { x: p0.x, y: p0.y }
    for (var j = 0; j < 1+t; j += t){

        // Compute new point
        var cX = 3 * (p1.x - p0.x),
            bX = 3 * (p2.x - p1.x) - cX,
            aX = p3.x - p0.x - cX - bX;
        
        var cY = 3 * (p1.y - p0.y),
            bY = 3 * (p2.y - p1.y) - cY,
            aY = p3.y - p0.y - cY - bY;
        
        var p = {
            x : (aX * Math.pow(j, 3)) + (bX * Math.pow(j, 2)) + (cX * j) + p0.x,
            y : (aY * Math.pow(j, 3)) + (bY * Math.pow(j, 2)) + (cY * j) + p0.y
        } 
        
        this.bresenham(l.x, l.y, p.x, p.y);

        this.ctx.strokeStyle = "#000000";
        this.ctx.beginPath();
        this.ctx.moveTo(l.x, l.y);
        this.ctx.lineTo(p.x, p.y);
        this.ctx.stroke();

        l = p;
    }

    // Draw line
    
}

Curve.prototype.draw_point = function (p) {
    this.ctx.fillStyle = (p.is_select) ? "orange": "black";
    let s = this.point_size;
    this.ctx.fillRect(p.x-s/2, p.y-s/2, s, s);
}

Curve.prototype.draw_line = function (a, b) {
    this.ctx.strokeStyle = "orange";
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();
}

Curve.prototype.draw = function () {

    
    
    this.curve_points.forEach(p => {
        this.draw_bezier(p.a, p.b, p.c, p.d)
    });

    this.curve_points.forEach(p => 
        this.draw_line(p.a, p.b) + 
        this.draw_line(p.c, p.d) + 
        this.draw_point(p.a) + 
        this.draw_point(p.b) +
        this.draw_point(p.c) + 
        this.draw_point(p.d)
    );
}

Curve.prototype.refresh = function () {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.draw();
}

// Create new object curve
let curve;

let start = () => {
    curve = new Curve();
}