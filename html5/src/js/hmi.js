/**
 * @file hmi.js
 * @author Oliver Merkel <Merkel(dot)Oliver(at)web(dot)de>
 * @date 2019 December 23
 *
 * @section LICENSE
 *
 * Copyright 2013-2019, Oliver Merkel <Merkel(dot)Oliver(at)web(dot)de>
 * All rights reserved.
 *
 * Released under the MIT license.
 *
 * @section DESCRIPTION
 *
 * @brief Class Hmi.
 *
 * Class representing the view or Hmi of Euler Square.
 * Euler Square is a solitaire tile placing game.
 *
 */

function Hmi() {
  this.tileColors = [
    "#ffc000", "#a0a0a0", "#ff0000", "#11cc55", "#505050",
    "#00ced1", "#a000a0", "#ffe4c4", "#600000", "#5050f0"
  ];
  this.tile = {};
  this.aspect = 1.5;
}

Hmi.prototype.dragstart = function(x, y, e) {
  this.dragElement = this.paper.getById(Number(e.target.raphaelid));
  var tmp = { x: this.dragElement.attr('x'), y: this.dragElement.attr('y') };
  this.oldTransform = { 'x': tmp.x, 'y': tmp.y };
  this.newTransform = { 'x': tmp.x, 'y': tmp.y };
  var k = this.dragElement.data('id')
  this.tile[k].outer.toFront();
  this.tile[k].inner.toFront();
  this.tile[k].touch.toFront();
};

Hmi.prototype.dragmove = function(dx, dy, x, y, e) {
  var size = Number($('#size').val());
  var tmpX = this.oldTransform.x + dx * size / this.size.x;
  var tmpY = this.oldTransform.y + dy * size * this.aspect / this.size.y;
  this.newTransform = { x: tmpX, y: tmpY };
  var k = this.dragElement.data('id')
  this.tile[k].outer.attr({ x: this.newTransform.x, y: this.newTransform.y });
  this.tile[k].inner.attr({ x: this.newTransform.x + 0.25, y: this.newTransform.y + 0.25 });
  this.tile[k].touch.attr({ x: this.newTransform.x, y: this.newTransform.y });
};

Hmi.prototype.dragend = function(e) {
  var size = Number($('#size').val());
  var tmp = {
    x: this.newTransform.y>=size+0.5 ? this.newTransform.x : Math.round(this.newTransform.x),
    y: this.newTransform.y>size && this.newTransform.y<size+0.5 ? size+0.5 :
    this.newTransform.y>=size+0.5 ? this.newTransform.y : Math.round(this.newTransform.y)
  };
  tmp = {
    x: tmp.x < 0 ? -1.0 : tmp.x > size ? size : tmp.x,
    y: tmp.y < 0 ? -1.0 : tmp.y > Math.floor(size*this.aspect) ? Math.floor(size*this.aspect) : tmp.y
  };
  var k = this.dragElement.data('id')
  this.tile[k].outer.attr({ x: tmp.x, y: tmp.y });
  this.tile[k].inner.attr({ x: tmp.x + 0.25, y: tmp.y + 0.25 });
  this.tile[k].touch.attr({ x: tmp.x, y: tmp.y });
};

Hmi.prototype.resize = function () {
  var size = Number($('#size').val());
  for( var k in this.tile ) {
    this.tile[k].board.attr({
      opacity: this.tile[k].initial.y >= size ||
        this.tile[k].initial.x >= size ? 0.0 : 1.0
    });
    this.tile[k].outer.attr({
      opacity: this.tile[k].initial.y >= size ||
        this.tile[k].initial.x >= size ? 0.0 : 1.0
    });
    this.tile[k].inner.attr({
      opacity: this.tile[k].initial.y >= size ||
        this.tile[k].initial.x >= size ? 0.0 : 1.0
    });
    this.tile[k].touch.attr({
      opacity: this.tile[k].initial.y >= size ||
        this.tile[k].initial.x >= size ? 0.0 : 0.01
    });
  }
  var panel = { x: size, y: size * this.aspect };
  var offsetHeight = 64,
    availableWidth = window.innerWidth - 64,
    availableHeight = window.innerHeight - offsetHeight;
  this.size = availableWidth/availableHeight < 1/this.aspect ?
    { x: availableWidth, y: availableWidth * this.aspect } :
    { x: availableHeight/this.aspect, y: availableHeight } ;
  this.paper.setSize( this.size.x, this.size.y );
  this.paper.setViewBox( -0.5, -0.5, panel.x+1.0, panel.y+1.0, false );
  var boardMarginTop = (availableHeight - this.size.y) / 2;
  $('#board').css({ 'margin-top': boardMarginTop + 'px' });
  $('#selectmenu').css({ 'margin-top': boardMarginTop + 'px' });
  $('#game-page').css({
    'background-size': 'auto ' + (this.size.x * 9 / 6) + 'px',
  });
  size = (this.size.x + this.size.y) / 2 / 9;
  var minSize = 60;
  var iconSize = size < minSize ? minSize : size;
  var maxSize = 120;
  iconSize = maxSize < iconSize ? maxSize : iconSize;
  $('#customMenu').css({
    'width': iconSize+'px', 'height': iconSize+'px',
    'background-size': iconSize+'px ' + iconSize+'px',
  });
  var backAttributes = {
    'width': iconSize+'px', 'height': iconSize+'px',
    'background-size': iconSize+'px ' + iconSize+'px',
  };
  $('#customBackRules').css(backAttributes);
  $('#customBackInfo').css(backAttributes);
  $('#customBackOptions').css(backAttributes);
  $('#customBackAbout').css(backAttributes);
  size = Number($('#size').val());
};

Hmi.prototype.initBoard = function () {
  var size = Number($('#size').val());
  this.paper = Raphael( 'board', size, size * this.aspect);
  this.paper.setViewBox(-0.5, -0.5, size+1.0, size*this.aspect+1.0, false );
  this.resize();
};

Hmi.prototype.initGame = function () {
  var size = Number($('#size').val());
  for(var y=0; y<10; ++y) {
    for(var x=0; x<10; ++x) {
      this.tile['x' + x + 'y' + y] = {
        'initial': { x: x, y: y },
        'board': this.paper.rect( x, y, 1, 1 ).attr({
            stroke: 'black', 'stroke-width': 0.1,
            'stroke-linecap': 'round',
            fill: 'none'
          }).toBack(),
        'outer': this.paper.rect( x, y, 1, 1 ).attr({
            stroke: 'black', 'stroke-width': 0.04,
            'stroke-linecap': 'round',
            fill: this.tileColors[x]
          }),
        'inner': this.paper.rect( x+0.25, y+0.25, 0.5, 0.5 ).attr({
            stroke: 'black', 'stroke-width': 0.03,
            'stroke-linecap': 'round',
            fill: this.tileColors[y]
          }),
        'touch': this.paper.rect( x, y, 1, 1 ).attr({
            stroke: 'none', 'stroke-width': 0.04,
            'stroke-linecap': 'round',
            fill: 'white', opacity: 0.01
          }),
      };
      
    }
  }
  this.paper.rect( -0.5, -0.5, size+1.0, size*this.aspect+1.0 ).attr({
    stroke: 'none', 'stroke-width': 0.0, 'stroke-linecap': 'round',
    fill: 'darkslategrey'
  }).toBack();
  for( var k in this.tile ) {
    this.tile[k].touch.data('id', k);
    this.tile[k].touch.drag(
      this.dragmove.bind( this ),
      this.dragstart.bind( this ),
      this.dragend.bind( this ),
    );
  }
  this.setHeader();
};

Hmi.prototype.updateChallenge = function() {
  var size = Number($('#size').val());
  for( var k in this.tile ) {
    if (this.tile[k].initial.y < size) {
      this.tile[k].outer.attr({
        x: this.tile[k].initial.x,
        y: this.tile[k].initial.y
      });
      this.tile[k].inner.attr({
        x: this.tile[k].initial.x + 0.25,
        y: this.tile[k].initial.y + 0.25
      });
      this.tile[k].touch.attr({
        x: this.tile[k].initial.x,
        y: this.tile[k].initial.y
      });
    }
  }
  this.resize();
}

Hmi.prototype.init = function () {
  this.initBoard();
  this.initGame();
  var $window = $(window);
  // window.onorientationchange( this.resize.bind( this ) );
  window.addEventListener("orientationchange", this.resize.bind( this ));
  $window.resize( this.resize.bind( this ) );
  $window.resize();
  $('#restart').on( 'click', this.startChallenge.bind(this) );
  $('#customBackOptions').on( 'click', this.updateChallenge.bind( this ) );
  $('#customOkOptions').on( 'click', this.updateChallenge.bind( this ) );
};

Hmi.prototype.startChallenge = function() {
  this.updateChallenge();
  $('#left-panel').panel('close');
};

Hmi.prototype.setHeader = function() {
  // $('#myheader').html( "Euler Square" );
};

var g_Hmi = new Hmi();
$(document).ready( function () { g_Hmi.init(); });
