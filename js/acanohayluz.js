var ANHL;

;(function(global, document, d3){

    "use strict";

    ANHL = global.ANHL = global.ANHL || {};

    ANHL.width = 550;
    ANHL.height = 600;
    ANHL.centered;

    ANHL.svg;
    ANHL.projection;
    ANHL.path;
    ANHL.mainGroup;

    ANHL.barrios = null;

    ANHL.rawData;
    ANHL.nestedData;

    ANHL.currentDay = 0;
    ANHL.currentHour = 0;

    ANHL.availableDays;
    ANHL.availableHours = d3.range(0,24);

    ANHL.$day = $('#day');
    ANHL.$hour = $('#hour');

    ANHL.$nextHour = $('#next-hour');
    ANHL.$prevHour = $('#prev-hour');

    ANHL.$play = $('#play');
    ANHL.$stop = $('#stop');
    ANHL.autoplayId;

    ANHL.init = function(){

      this.prepareSvg();

      var that = this;

      d3.json("data/barrios.json", function(error, pal){
        that.barriosLoaded(error, pal);
      });

      d3.csv("data/registros-por-barrio-por-dia-por-hora.csv", function(error, pal){
        that.dataLoaded(error, pal);
      });

    }

    //
    ANHL.prepareSvg = function(){
      this.svg = d3.select(".map").append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

      this.projection = d3.geo.mercator()
        .scale(157000)
        .center([-58.36000,-34.60102])

      this.path = d3.geo.path()
        .projection(this.projection);

      this.svg.append("rect")
          .attr("class", "background")
          .attr("width", this.width)
          .attr("height", this.height);

      this.mainGroup = this.svg.append("g");    
    }

    ANHL.dataLoaded = function(error, data){
      ANHL.rawData = data;
      ANHL.nestedData = d3.nest()
        .key(function(d) { return d.dia; })
        .key(function(d) { return d.hora; })
        .map(data, d3.map);

      ANHL.availableDays = ANHL.nestedData.keys();

      ANHL.initBindings();

    }

    ANHL.prepareChoropleth = function(){
      //TO-DO
    }

    ANHL.initBindings = function(){
      this.$prevHour.on('click',ANHL.prevHour);
      this.$nextHour.on('click',ANHL.nextHour);
      this.$play.on('click',function(){
        ANHL.autoplayId = setInterval(ANHL.nextHour,1000);
      });
      this.$stop.on('click',function(){
        clearInterval(ANHL.autoplayId);
      });
      ANHL.updateMap();
    }

    ANHL.updateMap = function() {

      ANHL.$day.html(ANHL.availableDays[ANHL.currentDay]);
      ANHL.$hour.html(ANHL.availableHours[ANHL.currentHour]);

      var data = ANHL.nestedData.get(ANHL.availableDays[ANHL.currentDay]).get(ANHL.availableHours[ANHL.currentHour]);
      
      if(data){
        data = d3.nest()
        .key(function(d) { return toID(d.nombre); })
        .rollup(function(d) { return parseInt(d[0].cantidad); })
        .map(data, d3.map);
        //TODO render map
        console.log(data);
        // ** TO-DO Add colorization based on the color scale (animated)
        /*country
          .transition()
            .duration(250)
          .style("fill",  function(d) { return data()[d.id] ? color()(data()[d.id]) : null; });*/
      } else {
        console.log('no data');
      }

    };

    ANHL.prevHour = function() {

      if (ANHL.currentHour == 0) {
        ANHL.currentHour = 23;
        ANHL.prevDay();
      } else {
        ANHL.currentHour--;
      };

      ANHL.updateMap();

    };

    ANHL.prevDay = function() {

      if (ANHL.currentDay == 0) {
        ANHL.currentDay = ANHL.availableDays.length-1;
      } else {
        ANHL.currentDay--;
      };

    };

    ANHL.nextHour = function() {

      if (ANHL.currentHour == 23) {
        ANHL.currentHour = 0;
        ANHL.nextDay();
      } else {
        ANHL.currentHour++;
      };

      ANHL.updateMap();

    };

    ANHL.nextDay = function() {

      if (ANHL.currentDay == ANHL.availableDays.length-1) {
        ANHL.currentDay = 0;
      } else {
        ANHL.currentDay++;
      };

    };

    //
    ANHL.barriosLoaded = function(error, pal){
      var subunits = topojson.feature(pal, pal.objects.barrios);
      this.barrios = subunits

      var g = this.mainGroup;

      g.append("g")
          .datum(subunits)
          .attr("d",this.path)

      g.selectAll(".subunit")
          .data(subunits.features)
          .enter().append("path")
          .attr("class", function(d) { 
            return "subunit " + unit_id(d) + unit_class(d); 
          })
          .attr("id", function(d) { 
            return unit_id(d); 
          })
          .attr("d", this.path)

      g.selectAll(".subunit-label")
          .data(subunits.features)
          .enter().append("text")
          .attr("class", function(d) { 
            return "subunit-label " + unit_id(d); 
          })
          .attr("transform", function(d) { return "translate(" + ANHL.path.centroid(d) + ")"; })
          .attr("dy", function(d){
            var dy = attrs[unit_class(d)] && attrs[unit_class(d)].dy
            if (! dy){
              dy = 0
            }
            return -0.5 + dy + "em"
          })
          .attr("dx", function(d){
            var dx = attrs[unit_class(d)] && attrs[unit_class(d)].dx
            if (! dx){ dx = 0 }
            return 0 + dx + "em"
          })
          .text(function(d) { 
            return unit_label(d)
          });

          var insertLinebreaks = function (d) {
            var el = d3.select(this);
            var words = el.text().split(' ');
            el.text('');

            for (var i = 0; i < words.length; i++) {
              var tspan = el.append('tspan').text(words[i]);
              if (i > 0)
              tspan.attr('x', 0).attr('dy', '1em');
            }
          };

          g.selectAll('text').each(insertLinebreaks);
    }

})(window, document, d3);

window.onload = function() {
    ANHL.init(); 
}


function toID(b){
  return b.replace(/ /g,"_").toLocaleLowerCase();
}

//TO-DO pasar estas funciones a otro lado
function unit_class(d){
  var n = 0
  var str = unit_id(d)
  for(var i=0; i < str.length; i++){
    n += str.charCodeAt(i)
  }
  return " b" + (n % 5)
}
function unit_overflows(d){
  return points[unit_id(d)]
}
function unit_id(d){
  return d && d.properties['BARRIO']
}
function unit_class(d){
  return unit_id(d).replace(/[ \.]+/g,"_").toLocaleLowerCase()
}


function unit_label(d){
  var words = d.properties['BARRIO'].split(' ')
  var ret = [] 
  for(var i=0; i<words.length; i++){
    word = words[i]
    ret.push(word[0].toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
  }
  return ret.join(' ')

}

attrs = {
  "recoleta": {dy: 1}
  , "belgrano": {dy: 1}
  , "paternal": {dy: 0, dx: -0.8}
  , "boca": {dx: -1, dx: -2}
  , "coghlan": {dy: 0.3}
  , "agronomia": {dy: 0.3}
  , "san_nicolas": {dy: -0.3}
  , "chacarita": {dy: 0.3, dx: 0.8}
  , "retiro": {dy: 1}
  , "versalles": {dy: 0.3}
  , "parque_patricios": {dy: -1.5}
  , "villa_santa_rita": {dy: -1.2}
  , "villa_del_parque": {dy: -1.0}
  , 'flores' : {dx: -1}
}