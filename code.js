var width = 1000,
    barHeight = 20,
	height = 450;

var y = d3.scale.linear()
    .range([height, 0]);

var chart = d3.select(".chart")
    .attr("width", width)
	.attr("height", height);
	
var name_data = [], height_data = [], weight_data = [], hr_data = [];
var number_of_bins = 32;
var xAxisPadding = 1;
var padding = 20;
var strokeColor = '#F00226';

function init() {
	d3.csv("baseball_data.csv", function(data) {
		
		var heights = data.map(function(i) {
			name_data.push(i.name);
			height_data.push(i.height);
			weight_data.push(i.weight);
			hr_data.push(i.HR);
			
			return parseInt(i.height);
		})
		console.log("Tarun", heights)

		var histogram = d3.layout.histogram().bins(number_of_bins)(heights);
		
		var min = d3.min(histogram.map(function(i) {
			return d3.min(i);
		}));
		var max = d3.max(histogram.map(function(i) {
			return d3.max(i);
		}));
		
		console.log("Tarun", max)
		console.log("Tarun", min)
		
		// Defining colors
		var barColors = d3.scale.linear().domain(
				[ 0, 0.25 * heights.length, 0.5 * heights.length,
						0.75 * heights.length, heights.length ]).range(
				[ '#F4D03E', '#4FBA6F', '#EF4836', '#52B3D9', '#FCBC0B' ]);
		
		var y = d3.scale.linear().domain(
				[ 0, 20 + d3.max(histogram.map(function(i) {
					return i.length;
				})) ]).range([ 0, height ]);

		var x = d3.scale.linear().domain([ min, max + xAxisPadding ]).range(
				[ 0, width ]);
				
		var xAxis = d3.svg.axis().scale(x).orient('bottom')
		
		var svg = d3.select('#chart').append('svg').attr('id', 'mainchart')
				.attr('height', height + padding).attr('width', width);
				
		var container = svg.append('g').attr('transform', 'translate(50,0)');
		container.append('text').text('Number of people').attr("text-anchor",
				"middle").attr("transform",
				"translate(-40," + (height / 2) + ")rotate(-90)").style(
				'color', '#5090A0');
		
		// Adding the x-axis
		var group = container.append('g').attr('transform',
				'translate(0,' + height + ')').call(xAxis);
		group.selectAll('path').style('fill', 'none').style('stroke',
				strokeColor);
		group.selectAll('line').style('stroke', strokeColor);
		
		var units = container.selectAll('.bar').data(histogram).enter().append('g');
		
		var bartooltip = d3.select('#chart').append('div').style('position',
				'absolute');
		
		units.append('rect').attr('x', function(d) {
			return x(d.x);
		}).attr('y', height).attr('width', function(d) {
			return x(min + d.dx);
		}).attr('height', 0).attr('fill', function(d, i) {
			return barColors(i);
		}).transition().each('end', function() {
			isTransitionInProcess = 1;
		}).duration(4000).delay(500).ease('elastic').attr('height',
				function(d) {
					return y(d.y);
				}).attr('y', function(d) {
			return height - y(d.y);
		});
		
		// Adding the y-axis
		var vScale = d3.scale.linear().domain(
				[ d3.max(histogram.map(function(i) {
					return i.length;
				})), 0 ]).range([ 0, height ]);
				
		var vAxis = d3.svg.axis().scale(vScale).orient('left').ticks(10);
		
		var vGuide = d3.select('svg').append('g').attr('transform',
				'translate(50,0)').call(vAxis);
		
		// Styling vertical guide
		vGuide.selectAll('path').style('fill', 'none').style('stroke',
				strokeColor);

		vGuide.selectAll('line').style('stroke', strokeColor);
	});
}