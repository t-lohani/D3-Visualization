var width = 1100;
var height = 450;
var padding = 10;

var stroke_color = '#FFF';
var census_type = 1;
var census_text;
var chart_type = 1;
var type_text;
var compressed_data = [];
var baseball_data = [];
var svg;
var container;
var bartooltip;
var units;
var x_axis;

var height_bin_count = 15;
var weight_bin_count = 21;
var hr_bin_count = 11;
var bin_count;

var bar_color = '#4682b4'
var bar_highlight_color = '#FF00FF'
var bar_padding = 0.1;
var bar_height_bulge = 3;
var isDrag = false;
var isMouseDown = false;
var last_x_pos;
var curr_x_pos;

var pie_width = 490;
var pie_height = 490;
var pie_radius = 245;

var force_width = 950;
var force_height = 450;

var menu_visible = false;

function init_chart() {
	destroy();
	if (census_type == 1) {
		initHistogram();
	} else if (census_type == 2) {
		initPieChart();
	} else {
		initForceChart();
	}
}

function changeChartType(value) {
	chart_type = value;
	init_chart();
}

function toggle_menu() {
	if (menu_visible) {
		menu_visible = false;
		document.getElementById('height_btn').style.display = 'none';
		document.getElementById('weight_btn').style.display = 'none';
		document.getElementById('hr_btn').style.display = 'none';
	} else {
		menu_visible = true;
		document.getElementById('height_btn').style.display = 'block';
		document.getElementById('weight_btn').style.display = 'block';
		document.getElementById('hr_btn').style.display = 'block';		
	}
}

function reset() {
	census_type = 1;
	d3.select('#chart').on('click', function() {
		if (!isDrag) {
			console.log("Tarun", "Onclick reset");
			census_type = 2;
			
		} else {
			isMouseDown = false;
			isDrag = false;
		}
	});
	init_chart();
}

function destroy() {
	
	d3.select('#bartooltip').remove();
	d3.select('#chart_layout').remove();
	d3.select('#piechart_layout').remove();
	d3.select('#forcechart_layout').remove();
	
	document.getElementById('legend_area').style.display = 'none';
	document.getElementById('legend_area').innerHTML = '';
}


function refreshHistogram() {
	d3.csv('baseball_data.csv', function(data) {
		if (chart_type == 1) {
			bin_count = height_bin_count;
		} else if (chart_type == 2) {
			bin_count = weight_bin_count;
		} else {
			bin_count = hr_bin_count;
		}		
		
		var hist_bin_data = d3.layout.histogram().bins(bin_count)(baseball_data);
	
		compressed_data = [];

		var min = d3.min(hist_bin_data.map(function(i) {
			compressed_data.push(i.y);
			return d3.min(i);
		}));
		
		var max = d3.max(hist_bin_data.map(function(i) {
			return d3.max(i);
		}));
		
		var step = (max - min) / bin_count;
		bar_padding = step*0.1;
		
		var y = d3.scale.linear()
				.domain([0, 20 + d3.max(hist_bin_data.map(function(i) {return i.length;}))])
				.range([0, height]);

		var x = d3.scale.linear()
				.domain([ min, max + step * 0.25])
				.range([ 0, width ]);
		
		x_axis = d3.svg.axis()
		   .scale(x)
		   .orient('bottom')
		   .ticks(bin_count);
		
		d3.select('#group').remove();
		var group = container.append('g')
							 .attr('id', 'group')
							 .attr('transform', 'translate(20,' + height + ')')
							 .call(x_axis);

		group.selectAll('path').style('fill', 'none').style('stroke', stroke_color);
		group.selectAll('line').style('stroke', stroke_color);
		group.selectAll('text').style('stroke', stroke_color);
		
		svg.selectAll('rect').remove();
		units = container.selectAll('.bar').data(hist_bin_data).enter().append('g');

		var orig_width;
		var orig_height
		var orig_xpos;
		var orig_ypos;
		var transition_in_process = true;
		
		units.append('rect')
			 .attr('x', function(d) {return x(d.x + bar_padding) + 20;})
			 .attr('y', height)
			 .attr('width', function(d) {return x(min + d.dx - bar_padding*2);})
			 .attr('height', 0)
			 .attr('margin', 5)
			 .attr('fill', bar_color)
			 .on('mouseover', function(d) {
				if (transition_in_process) {
					return;
				}
				
				if (isDrag) {
					return;
				}
				
				// Setting navy blue to the highlighted bar
				this.style.fill = 'rgb(206, 11, 41)';
				
				bartooltip.transition()
						  .style('font-family', 'verdana')
						  .style('color', stroke_color);
						  
				bartooltip.html(d.y)
						  .style('left', (d3.event.pageX - 15) + 'px')
						  .style('top', (height - y(d.y) + 50) + 'px');
				
				orig_width = d3.select(this).attr('width');
				orig_height = d3.select(this).attr('height');
				orig_xpos = d3.select(this).attr('x');
				orig_ypos = d3.select(this).attr('y');
				
				d3.select(this).attr('x', function(d) {
					return x(d.x - bar_padding/2) + 20;
				});
				d3.select(this).attr('width', function(d) {
					return x(min + d.dx + bar_padding);
				})
				d3.select(this).attr('y', function(d) {
					return height - y(d.y) - bar_height_bulge;
				});
				d3.select(this).attr('height', function(d) {
					return y(d.y) + bar_height_bulge;
				});
			 })
			 .on('mouseout', function(d) {
				if (transition_in_process) {
					return;
				}
				
				if (isDrag) {
					return;
				}
				
				this.style.fill = bar_color;
				d3.select(this).attr('x', function(d) {
					return orig_xpos;
				});
				d3.select(this).attr('width', function(d) {
					return orig_width;
				})
				d3.select(this).attr('y', function(d) {
					return orig_ypos;
				});
				d3.select(this).attr('height', function(d) {
					return orig_height;
				});
				bartooltip.html('');
				d3.select('#bartooltip').remove();
			 })
			 .transition().each('end', function() {transition_in_process = false;})
			 .duration(0)
			 .delay(0)
			 .ease('linear')
			 .attr('height', function(d) {return y(d.y);})
			 .attr('y', function(d) {return height - y(d.y);});

		
		// Creating vertical scale
		var vert_scale = d3.scale.linear()
						   .domain([ 20 + d3.max(hist_bin_data.map(function(i) {return i.length;})), 0 ])
						   .range([ 0, height ]);

		// Creating vertical axis
		var vert_axis = d3.svg.axis()
						  .scale(vert_scale)
						  .orient('left')
						  .ticks(10);

		d3.select('#vert_guide').remove();
		//svg.select(vert_guide).remove()
		var vert_guide = d3.select('svg')
						   .append('g')
						   .attr('id', 'vert_guide')
						   .attr('transform', 'translate(70, -15)')
						   .call(vert_axis);
						   
		vert_guide.selectAll('path').style('fill', 'none').style('stroke', stroke_color);
		vert_guide.selectAll('line').style('stroke', stroke_color);
		vert_guide.selectAll('text').style('stroke', stroke_color);
	});
}


function initHistogram() {
	
	d3.csv('baseball_data.csv', function(data) {

		// Storing the height/weight/hr data as baseball_data
		baseball_data = data.map(function(i) {
			if (chart_type == 1) {
				bin_count = height_bin_count;
				census_text = "Baseball players' heights";
				return parseInt(i.height);
			} else if (chart_type == 2) {
				bin_count = weight_bin_count;
				census_text = "Baseball players' weights";
				return parseInt(i.weight);
			} else if (chart_type == 3) {
				bin_count = hr_bin_count;
				census_text = "Baseball players' heart rates";
				return parseInt(i.HR);
			}
		})

		// Making data bins according to the bin_count
		var hist_bin_data = d3.layout.histogram().bins(bin_count)(baseball_data);
		
		compressed_data = [];
		
		// Getting the minimum height 
		var min = d3.min(hist_bin_data.map(function(i) {
			compressed_data.push(i.y);
			return d3.min(i);
		}));
		
		// Getting the maximum height
		var max = d3.max(hist_bin_data.map(function(i) {
			return d3.max(i);
		}));
		
		var step = (max - min) / bin_count;
		bar_padding = step * 0.1;
		
		//console.log("Tarun", "Min : " + min);
		//console.log("Tarun", "Max : " + max);
		//console.log("Tarun", "Step : " + step);
		
		// Setting y range by getting the maximum bar height
		var y = d3.scale.linear()
				.domain([0, 20 + d3.max(hist_bin_data.map(function(i) {return i.length;}))])
				.range([0, height]);

		// Setting x range by getting the minimum and maximu height values
		var x = d3.scale.linear()
				.domain([ min, max + step * 0.25])
				.range([ 0, width ]);
				
		svg = d3.select('#chart')
					.append('svg')
					.attr('id', 'chart_layout')
					.attr('height', height + padding)
					.attr('width', 1200)
					.on('mousedown', function(d) {
						//console.log("Tarun", "Inside mousedown");
						isMouseDown = true;
						last_x_pos = d3.event.pageX;
					})
					.on('mousemove', function(d) {
						if (isMouseDown) {
							isDrag = true;
							curr_x_pos = d3.event.pageX;
							//console.log("Tarun", "isMouseDown : " + isMouseDown);
							if (last_x_pos - curr_x_pos > 100) {
								if (chart_type == 1 && height_bin_count > 1) {
									height_bin_count--;
								} else if (chart_type == 2 && weight_bin_count > 1) {
									weight_bin_count--;
								} else if (chart_type == 3 && hr_bin_count > 1){
									hr_bin_count--;
								}
								last_x_pos = curr_x_pos;
								refreshHistogram();
							} else if (last_x_pos - curr_x_pos < -100) {
								if (chart_type == 1) {
									height_bin_count++;
								} else if (chart_type == 2) {
									weight_bin_count++;
								} else if (chart_type == 3) {
									hr_bin_count++;
								}
								last_x_pos = curr_x_pos;
								refreshHistogram();
							}
						}
					})
					.on('mouseup', function(d) {
						isMouseDown = false;
					})
					.on('click', function() {
						if (!isDrag) {
							//console.log("Tarun", "Onclick");
							census_type = 2;
							init_chart();
						} else {
							isMouseDown = false;
							isDrag = false;
						}
					});

		container = svg.append('g').attr('transform', 'translate(50, -15)');
		
		// Setting y axis text
		container.append('text')
				 .text('Count of players')
				 .attr('id', 'yaxis_text')
				 .attr("text-anchor", "middle")
				 .attr("transform", "translate(-30," + (height / 2) + ")rotate(-90)")
				 .style('stroke', '#FFF');
		
		// Making x axis
		x_axis = d3.svg.axis()
					   .scale(x)
					   .orient('bottom')
					   .ticks(bin_count);
		
		// Initializing X axis container and appending x-axis
		var group = container.append('g')
							 .attr('id', 'group')
							 .attr('transform', 'translate(20,' + height + ')')
							 .call(x_axis);

		group.selectAll('path').style('fill', 'none').style('stroke', stroke_color);
		group.selectAll('line').style('stroke', stroke_color);
		group.selectAll('text').style('stroke', stroke_color);

		// Adding histogram bin data to SVG
		units = container.selectAll('.bar').data(hist_bin_data).enter().append('g');

		bartooltip = d3.select('#chart')
						   .append('div')
						   .style('position', 'absolute');
		
		var orig_width;
		var orig_height
		var orig_xpos;
		var orig_ypos;
		var transition_in_process = true;
		
		//console.log("Tarun", units);
		// Appending rectangles in histogram
		units.append('rect')
			 .attr('x', function(d) {return x(d.x + bar_padding) + 20;})
			 .attr('y', height)
			 .attr('width', function(d) {return x(min + d.dx - bar_padding*2);})
			 .attr('height', 0)
			 .attr('margin', 5)
			 .attr('fill', bar_color)
			 .on('mouseover', function(d) {
				if (transition_in_process) {
					return;
				}
				
				if (isDrag) {
					return;
				}
				
				// Setting navy blue to the highlighted bar
				this.style.fill = 'rgb(206, 11, 41)';
				
				bartooltip.transition()
						  .style('font-family', 'verdana')
						  .style('color', stroke_color);
						  
				bartooltip.html(d.y)
						  .style('left', (d3.event.pageX - 15) + 'px')
						  .style('top', (height - y(d.y) + 50) + 'px');
				
				orig_width = d3.select(this).attr('width');
				orig_height = d3.select(this).attr('height');
				orig_xpos = d3.select(this).attr('x');
				orig_ypos = d3.select(this).attr('y');
				
				d3.select(this).attr('x', function(d) {
					return x(d.x - bar_padding/2) + 20;
				});
				d3.select(this).attr('width', function(d) {
					return x(min + d.dx + bar_padding);
				})
				d3.select(this).attr('y', function(d) {
					return height - y(d.y) - bar_height_bulge;
				});
				d3.select(this).attr('height', function(d) {
					return y(d.y) + bar_height_bulge;
				});
			 })
			 .on('mouseout', function(d) {
				if (transition_in_process) {
					return;
				}

				if (isDrag) {
					return;
				}
				
				this.style.fill = bar_color;
				d3.select(this).attr('x', function(d) {
					return orig_xpos;
				});
				d3.select(this).attr('width', function(d) {
					return orig_width;
				})
				d3.select(this).attr('y', function(d) {
					return orig_ypos;
				});
				d3.select(this).attr('height', function(d) {
					return orig_height;
				});
				bartooltip.html('');
				d3.select('#bartooltip').remove();
			 })
			 .transition().each('end', function() {transition_in_process = false;})
			 .duration(0)
			 .delay(0)
			 .ease('linear')
			 .attr('height', function(d) {return y(d.y);})
			 .attr('y', function(d) {return height - y(d.y);});

		// Creating vertical scale
		var vert_scale = d3.scale.linear()
						   .domain([ 20 + d3.max(hist_bin_data.map(function(i) {return i.length;})), 0 ])
						   .range([ 0, height ]);

		// Creating vertical axis
		var vert_axis = d3.svg.axis()
						  .scale(vert_scale)
						  .orient('left')
						  .ticks(10);

		// 
		var vert_guide = d3.select('svg')
						   .append('g')
						   .attr('id', 'vert_guide')
						   .attr('transform', 'translate(70, -15)')
						   .call(vert_axis);

		vert_guide.selectAll('path').style('fill', 'none').style('stroke', stroke_color);
		vert_guide.selectAll('line').style('stroke', stroke_color);
		vert_guide.selectAll('text').style('stroke', stroke_color);

		document.getElementById("census_text").innerHTML = census_text;
	});
}


function initPieChart() {

	d3.csv('baseball_data.csv', function(data) {
		
		// Storing the height/weight/hr data as baseball_data
		baseball_data = data.map(function(i) {
			if (chart_type == 1) {
				bin_count = height_bin_count;
				type_text = "Height";
				census_text = "Baseball players' heights";
				return parseInt(i.height);
			} else if (chart_type == 2) {
				bin_count = weight_bin_count;
				type_text = "Weight";
				census_text = "Baseball players' weights";
				return parseInt(i.weight);
			} else if (chart_type == 3) {
				bin_count = hr_bin_count;
				type_text = "Heart Rate";
				census_text = "Baseball players' heart rates";
				return parseInt(i.HR);
			}
		})
		
		compressed_data = [];
		
		var pie_bin_data = d3.layout.histogram().bins(bin_count)(baseball_data);
		
		// Getting the minimum height 
		var min = d3.min(pie_bin_data.map(function(i) {
			compressed_data.push(i.y);
			return d3.min(i);
		}));
		
		// Getting the maximum height
		var max = d3.max(pie_bin_data.map(function(i) {
			return d3.max(i);
		}));
		
		
		var legend = "";
		var step = (max - min) / bin_count;
		var previous = min;
		var next;
		
		legend = legend + "Number of people (" + type_text + " Range)" + "<ul>";
		for (var i = 0; i < bin_count; i++) {
			next = previous + step;
			legend = legend + "<li>" + compressed_data[i] + " ("
					+ parseFloat(previous).toFixed(0) + " - "
					+ parseFloat(next).toFixed(0) + ")</li>";
			previous = next;
		}
		legend = legend + "</ul>";

		document.getElementById('legend_area').style.display = 'block';
		document.getElementById('legend_area').innerHTML = legend;
					   
		var colors = d3.scale.category20();

		var arc = d3.svg.arc().outerRadius(pie_radius).innerRadius(0);
		var pie_chart = d3.layout.pie().value(function(d) {return d;});

		d3.select('#chart').on('click', function() {
			//console.log("Tarun", "Onclick pie");
			census_type = 3;
			init_chart();
		});
		
		svg = d3.select('#chart')
					.append('svg')
					.attr('id', 'piechart_layout')
					.attr('width', pie_width)
					.attr('height', pie_height)
					.style('margin-left', '230px');

		container = svg.append('g')
						   .attr('transform', 'translate(' + (pie_width-pie_radius) + ', ' + (pie_height-pie_radius) + ')');

		container.selectAll('path')
				 .data(pie_chart(compressed_data))
				 .enter()
				 .append('g')
				 .attr('class', 'slice');

		d3.selectAll('g.slice')
		  .append('path')
		  .attr('d', 0)
		  .style('fill', function(d, i) {return colors(i);})
		  .style('stroke', '#FFF')
		  .transition()
		  .duration(100)
		  .delay(0)
		  .attr('d', arc)
		  .ease('bounce');

		d3.selectAll('g.slice')
		  .append('text')
		  .text(function(d, i) {return d.data;})
		  .attr('transform', function(d) {return 'translate(' + arc.centroid(d) + ')';})
		  .style('fill', '#000')
		  .style('text-anchor', 'middle')
		  .style('font-family', 'verdana');

		document.getElementById("census_text").innerHTML = census_text;
	});
}


function initForceChart() {
	
	d3.csv('baseball_data.csv', function(data) {
		console.log("Tarun", "initForceChart");
		// Storing the height/weight/hr data as baseball_data
		baseball_data = data.map(function(i) {
			if (chart_type == 1) {
				bin_count = height_bin_count;
				type_text = "Height";
				census_text = "Baseball players' heights";
				return parseInt(i.height);
			} else if (chart_type == 2) {
				bin_count = weight_bin_count;
				type_text = "Weight";
				census_text = "Baseball players' weights";
				return parseInt(i.weight);
			} else if (chart_type == 3) {
				bin_count = hr_bin_count;
				type_text = "Heart Rate";
				census_text = "Baseball players' heart rates";
				return parseInt(i.HR);
			}
		})

		compressed_data = [];

		var force_bin_data = d3.layout.histogram().bins(bin_count)(baseball_data);

		var min = d3.min(force_bin_data.map(function(i) {
			compressed_data.push(i.y);
			return d3.min(i);
		}));
		var max = d3.max(force_bin_data.map(function(i) {
			return d3.max(i);
		}));

		var nodes = [];
		var links = [];
		var step = (max - min) / bin_count;
		var previous = min;
		var next;
		
		nodes.push({
			name : type_text,
			value : "Parent"
		});
		
		var legend = "";
		legend = "Number of people (" + type_text + " Range)" + "<ul>";
		for (var i = 0; i < bin_count; i++) {
			next = previous + step;
			nodes.push({
				name : compressed_data[i],
				value : compressed_data[i],
				target : [0]
			})
			legend = legend +  "<li>" + compressed_data[i] + " ("
					+ parseFloat(previous).toFixed(0) + " - "
					+ parseFloat(next).toFixed(0) + ")</li>";
			previous = next;
		}
		legend = legend + "</ul>";

		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i].target == undefined)
				continue;
			for (var j = 0; j < nodes[i].target.length; j++) {
				links.push({
					source : nodes[i],
					target : nodes[nodes[i].target[j]]
				})
			}
		}

		var force_chart = d3.layout.force()
							.nodes(nodes)
							.links([])
							.linkStrength(0.3)
							.friction(0.9)
							.linkDistance(100)
							.charge(-300)
							.gravity(0.1)
							.theta(0.8)
							.alpha(0.1)
							.size([force_width, force_height]);

		container = d3.select('#chart')
						  .on('click', null)
						  .append('svg')
						  .attr('id', 'forcechart_layout')
						  .attr('width', force_width)
						  .attr('height', force_height);

		document.getElementById('legend_area').style.display = 'block';
		document.getElementById('legend_area').innerHTML = legend;

		var colors = d3.scale.category20();
		var node = container.selectAll('circle')
							.on('click', null)
							.data(nodes)
							.enter()
							.append('g')
							.call(force_chart.drag);

		var link = container.selectAll('line')
							.data(links)
							.enter()
							.append('line')
							.style('stroke', '#FFF')
							.style("stroke-width", 1);

		node.append('circle')
			.attr('cx', function(d) {return d.x})
			.attr('cy', function(d) {return d.y})
			.attr('fill', '#FFF')
			.on('click', null)
			.attr('r', 15)
			.style('z-index', 5);

		node.append('text')
			.text(function(d, i) {return d.name;})
			.attr("transform", function(d) { 
				return 'translate(' + [20, 0] + ')'; 
			})
			.style('fill', '#FFF');

		force_chart.on('tick', function() {
			node.attr('transform', function(d) {
				return 'translate(' + d.x + ', ' + d.y + ')';
			})

			link.attr("x1", function(d) {
				return d.source.x;
			}).attr("x2", function(d) {
				return d.target.x;
			}).attr("y1", function(d) {
				return d.source.y;
			}).attr("y2", function(d) {
				return d.target.y;
			});
		});
		
		force_chart.start();
		document.getElementById("census_text").innerHTML = census_text;
	});
}