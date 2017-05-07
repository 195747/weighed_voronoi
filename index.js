var mymap = L.map('mapid').setView([51.75, 19.45], 16);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery Š <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
    }).addTo(mymap);


var svg_layer = d3.select(mymap.getPanes().overlayPane).append("svg"),
zoom_hide = svg_layer.append("g").attr("class", "leaflet-zoom-hide");

d3.json("map.json" , function (error, collection) {
    if(error) throw error;

    var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);

    var feature = zoom_hide.selectAll("path")
        .data(collection.features)
        .enter().append("path");

    mymap.on("viewreset", reset);
    reset();

    //reposition SVG by pokryc featury
    function reset() {
        var bounds = path.bounds(collection),
            topLeft = bounds[0],
            bottomRight = bounds[1];

        svg_layer.attr("width", bottomRight[0] - topLeft[0] + 50)
            .attr("height", bottomRight[1] - topLeft[1] + 50)
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        zoom_hide.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        feature.attr("d", path);
    }

    //leaflet for d3 geom transformation.
    function projectPoint(x, y) {
        var point = mymap.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }

});





var width = 960,
    height = 500,
    padding = 2,
    min_padding = 0,
    max_padding = 50,
    maxRadius = 30;

var dx=10, dy=10;
var nodes = [
  {id:1, x: 100, y:100, radius: 1},
  {id:2, x: 100+dx, y:100, radius: 1},
  {id:3, x: 100+dx, y:100+dy, radius: 1},
  {id:4, x: 100, y:100+dy, radius: 1}
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

var cells = svg.append("g").attr("class", "cells")
    .selectAll('.cell')
    .data(voronoi(nodes));

cells.enter().append('path')
    .attr('class', 'cell');

var circle = svg.append("g").attr("class", "ref_circles")
    .selectAll("circle")
    .data(nodes);

var sites = svg.append("g").attr("class", "sites")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 2.5)
    .call(drawSite);

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

function drawSite(circle){
    circle
        .attr("cx", function (d){ return d.cx })
        .attr("cy", function(d){ return d.cy });
}
