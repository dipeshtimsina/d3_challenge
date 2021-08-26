
//setup: formating 
var svgWidth = 960;
var svgHeight = 500;
var margin = {
  top: 25,
  right: 40,
  bottom: 75,
  left: 100
};
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);


  // Initial Params
var chosenXAxis = "poverty";
// updating xscale margins with scales
function xScale(censusData, chosenXAxis) {
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, d => d[chosenXAxis]) * 0.8,
      d3.max(censusData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);
  return xLinearScale;
}

//updating xaxis with clicks
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);
  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);
  return xAxis;
}
//circles with new circlegroup margin 
function renderCircles(circlesGroup, newXScale, chosenXAxis) {
  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));
  return circlesGroup;
}
// text used to transition to new circles 
function renderText(circlesText, newXScale, chosenXAxis) {
  circlesText.transition()
    .duration(1000)
    .attr("dx", d => newXScale(d[chosenXAxis]));
  return circlesText;
}
//tooltips  and what to highlight
function updateToolTip(chosenXAxis, circlesGroup) {
  var label;
  if (chosenXAxis === "poverty") {
    label = "Poverty (%):";
  }
  else {
    label = "Age (Median):";
  }
  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return (`${d.state}<br>${label} ${d[chosenXAxis]}`);
    });
  circlesGroup.call(toolTip);
  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data);
  })
  //with mouse movement 
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });
  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("data/data.csv").then(function(censusData, err) {
  if (err) throw err;

  // parse data
  censusData.forEach(function(data) {
    data.poverty = +data.poverty;
    data.healthcare = +data.healthcare;
    data.age = +data.age;
  });
  //x,y with initial axis 
  var xLinearScale = xScale(censusData, chosenXAxis);
  var yLinearScale = d3.scaleLinear()
    .domain([0, d3.max(censusData, d => d.healthcare)])
    .range([height, 0]);
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);
//append x, y axis and the initial circle, then add text to the circle
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);
  chartGroup.append("g")
    .call(leftAxis);
  var circlesGroup = chartGroup.selectAll("g circle")
    .data(censusData)
    .enter()
    .append("g")
  var circlesXY = circlesGroup.append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d.healthcare))
    .attr("r", 15)
    .classed("stateCircle", true);
  var circlesText = circlesGroup.append("text")
    .text(d => d.abbr)
    .attr("dx", d => xLinearScale(d[chosenXAxis]))
    .attr("dy", d => yLinearScale(d.healthcare) +5)
    .classed("stateText", true);

  // two x-axis labels, the pull the information for the event, for poverty and similarly for age 
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);
  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") 
    .classed("active", true)
    .text("In Poverty (%)");
  var ageLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") 
    .classed("inactive", true)
    .text("Age (Median)");

  //add y axis, and update tooltip
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Lacks Healthcare (%)");
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);
  // x axis labels for event listener, give value of selection
  labelsGroup.selectAll("text")
    .on("click", function() {
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replace and show value of the chosen, then updates x for new data
        chosenXAxis = value;
        xLinearScale = xScale(censusData, chosenXAxis);
        xAxis = renderAxes(xLinearScale, xAxis);
        circlesXY = renderCircles(circlesXY, xLinearScale, chosenXAxis);
        circlesText = renderText(circlesText, xLinearScale, chosenXAxis)
        
        // updates tooltips with new info, to get boldtext selection
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup);
        if (chosenXAxis === "age") {
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
        }

      }
    });
}).catch(function(error) {
  console.log(error);
});