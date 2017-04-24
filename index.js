var width = 960,
    height = 500,
    padding = 2,
    min_padding = 0,
    max_padding = 50,
    maxRadius = 30;

var dx=10, dy=10;
var nodes = [
  {id:1, x: 100, y:100, radius: 10},
  {id:2, x: 100+dx, y:100, radius: 10},
  {id:3, x: 100+dx, y:100+dy, radius: 10},
  {id:4, x: 100, y:100+dy, radius: 10}
];
nodes.forEach(function(d) {
  d.cx=d.x; 
  d.cy=d.y;
});

var voronoi = d3.geom.voronoi()
  .clipExtent([[-padding,-padding],[width+padding,height+padding]])
  .x(function(d){ return d.x; })
  .y(function(d){ return d.y; });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var cells = svg.selectAll('.cell')
  .data(voronoi(nodes));

cells.enter().append('path')
  .attr('class', 'cell');

var circle = svg.selectAll("circle")
    .data(nodes);

var enter_circle = circle.enter().append("circle")
  	.attr('class', 'node');

enter_circle
	.attr("r", function(d) { return d.radius; })
	.attr("cx", function(d) { return d.cx; })
  .attr("cy", function(d) { return d.cy; });

var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(.02)
    .charge(0)
    .on("tick", tick)
    .start();

force.alpha(.05);

function tick(e) {
  circle
		.each(gravity(.2 * e.alpha))
		.each(collide(.5))
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

  cells
    .data(voronoi(nodes));

  cells
    .attr('d', function(d){
      if (d.length > 0)
        return "M" + d.join("L") + "Z";
      else {
        return '';
      }
    });
}

// Resolve collisions between nodes.
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + maxRadius + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + padding;
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

//	Move nodes toward cluster focus.
function gravity(alpha) {
	return function(d) {
		d.y += (d.cy - d.y) * alpha;
		d.x += (d.cx - d.x) * alpha;
	};
}
