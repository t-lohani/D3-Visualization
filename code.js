var width = 960,
    barHeight = 20,
	height = 500;

var y = d3.scaleLinear()
    .range([height, 0]);

var chart = d3.select(".chart")
    .attr("width", width)
	.attr("height", height);

d3.csv("data.csv", function(data) {
	y.domain([0, d3.max(data, function(d) { return d.weight; })]);

	var barWidth = width / data.length;
	console.log("Tarun", barWidth);
	//chart.attr("height", barHeight * data.length);

	var bar = chart.selectAll("g")
      .data(data)
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(" + i * barHeight + ",0)"; });

	bar.append("rect")
	  .attr("y", function(d) { return y(d.weight); })
	  .attr("height", function(d) { return height - y(d.weight); })
      .attr("width", barWidth + 18);

	bar.append("text")
      .attr("x", barWidth / 2)
      .attr("y", function(d) { return y(d.weight) + 3; })
      .attr("dy", ".75em")
      .text(function(d) { return d.weight; });
});