var dataset = []

var renderGraph = function(d3) {
        'use strict';

        console.log("Graph.js is running.");
        console.log("currentLoggedInUsers = " + currentLoggedInUsers);
        console.log("currentTotalUsers = " + currentTotalUsers);
        
        var logged_in = currentLoggedInUsers;
        var offline = currentTotalUsers - currentLoggedInUsers;
        
        dataset = [
          { label: 'Online: ' + logged_in, count: logged_in }, 
          { label: 'Offline: ' + offline, count: offline }
        ];
        
        var width = 150;
        var height = 150;
        var radius = Math.min(width, height) / 2;
        var donutWidth = 20;
        var legendRectSize = 18;                                  // NEW
        var legendSpacing = 4;                                    // NEW

        var color = d3.scale.category20b();


        var homegraph = document.getElementById("homegraph");
        while (homegraph.firstChild) {
               homegraph.removeChild(homegraph.firstChild);
        }

        var svg = d3.select('#homegraph')
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
      
var updateGraph = function() {
        console.log("In updateGraph().");
        console.log("currentLoggedInUsers = " + currentLoggedInUsers);
        console.log("currentTotalUsers = " + currentTotalUsers);
        dataset = [
          { label: 'Logged in users', count: currentLoggedInUsers }, 
          { label: 'Offline users', count: currentTotalUsers - currentLoggedInUsers }
        ];
};