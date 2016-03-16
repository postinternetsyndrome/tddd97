var renderGraphs = function() {
  renderLoggedInGraph();
  renderVisitsGraph();
  renderMessagesGraph();
}

var renderLoggedInGraph = function() {
        var online = currentLoggedInUsers;
        var offline = currentTotalUsers - currentLoggedInUsers;
        var dataset = [
          { label: 'Online: ' + online, count: online }, 
          { label: 'Offline: ' + offline, count: offline }
        ];
        renderGraph(window.d3, dataset, "loggedingraph")
}

var renderVisitsGraph = function() {
        var myvisits = currentVisitsToMyProfile;
        var totalvisits = currentTotalVisitsToProfiles;
        var dataset = [
          { label: 'Mine: ' + myvisits, count: myvisits }, 
          { label: 'Others: ' + totalvisits, count: totalvisits - myvisits }
        ];
        renderGraph(window.d3, dataset, "visitsgraph");
}

var renderMessagesGraph = function() {
  var dataset = currentRecentMessagesCount;
  renderLineGraph(window.d3, dataset, "messagesgraph");
}

var renderGraph = function(d3, dataset, location) {
        'use strict';

        var width = 150;
        var height = 150;
        var radius = Math.min(width, height) / 2;
        var donutWidth = 20;
        var legendRectSize = 18;                                  // NEW
        var legendSpacing = 4;                                    // NEW

        var color = d3.scale.category20b();

        var graph = document.getElementById(location);
        if (graph != null){
          while (graph.firstChild) {
                 graph.removeChild(graph.firstChild);
          }
        }

        var svg = d3.select('#' + location)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .attr('transform', 'translate(' + (width / 2) + 
            ',' + (height / 2) + ')');

        var arc = d3.svg.arc()  
          .innerRadius(radius - donutWidth)
          .outerRadius(radius);

        var pie = d3.layout.pie()
          .value(function(d) { return d.count; })
          .sort(null);

        var path = svg.selectAll('path')
          .data(pie(dataset))
          .enter()
          .append('path')
          .attr('d', arc)
          .attr('fill', function(d, i) { 
            return color(d.data.label);
          });

        var legend = svg.selectAll('.legend')                     // NEW
          .data(color.domain())                                   // NEW
          .enter()                                                // NEW
          .append('g')                                            // NEW
          .attr('class', 'legend')                                // NEW
          .attr('transform', function(d, i) {                     // NEW
            var height = legendRectSize + legendSpacing;          // NEW
            var offset =  height * color.domain().length / 2;     // NEW
            var horz = -2 * legendRectSize;                       // NEW
            var vert = i * height - offset;                       // NEW
            return 'translate(' + horz + ',' + vert + ')';        // NEW
          });                                                     // NEW

        legend.append('rect')                                     // NEW
          .attr('width', legendRectSize)                          // NEW
          .attr('height', legendRectSize)                         // NEW
          .style('fill', color)                                   // NEW
          .style('stroke', color);                                // NEW
          
        legend.append('text')                                     // NEW
          .attr('x', legendRectSize + legendSpacing)              // NEW
          .attr('y', legendRectSize - legendSpacing)              // NEW
          .text(function(d) { return d; });                       // NEW

      };
      
var renderLineGraph = function(d3, dataset, location) {
        console.log("graph.js: rendering message graph");
        
        var graph = document.getElementById(location);
        if (graph != null){
          while (graph.firstChild) {
                 graph.removeChild(graph.firstChild);
          }
        }
        // Set the dimensions of the canvas / graph
        var margin = {top: 30, right: 20, bottom: 30, left: 50},
            ///width = 570 - margin.left - margin.right,
            //height = 270 - margin.top - margin.bottom;
            width = 400 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        // Set the ranges
        var x = d3.scale.linear().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);
        
        // Define the axes
        var xAxis = d3.svg.axis().scale(x)
            .orient("bottom").ticks(10);
        
        var yAxis = d3.svg.axis().scale(y)
            .orient("left").ticks(5);
        
        var processed_data = []
        for (i = 0; i < dataset.length; ++i) {
          processed_data[i] = [i, dataset[i]]
        }
        // Define the line
        var valueline = d3.svg.line()
            .x(function(d) { return x(d[0]); })
            .y(function(d) { return y(d[1]); });
          
        // Adds the svg canvas
        var svg = d3.select("#messagesgraph")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", 
                      "translate(" + margin.left + "," + margin.top + ")");
        
        x.domain([0, dataset.length]);
        y.domain([0, Math.max(...dataset)]);
        
        // Add the valueline path.
        svg.append("path")
            .attr("class", "line")
            .attr("d", valueline(processed_data));
    
        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    
        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
}
