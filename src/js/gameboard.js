/*
    This software package has a mixed license model. If not otherwise stated
    then the license applies as follows.
  
    The [info.html background information section] contains descriptions
    and hints on material used from other sources and creators and/or authors of related
    items. Due to the fact that the related material and underlying principles are already
    aged and been published several centuries ago these are in the public domain.
  
    It occurs that in case of simple reproduction of material and usage of Creative
    Commons alike licensing a more detailed license description can be found looking into
    the given references mentioned.
  
    Trademarks mentioned belong to their holders respectively and clearly and I solely
    mention these in purpose of citation and referencing.
  
    Created by Oliver Merkel on June 25th, 2013.
  
    Copyright (c) 2013
    @author Oliver Merkel, Merkel(dot)Oliver(at)web(dot)de.
    All rights reserved.
  
    @version 1.0
    @since   2013-06-25
  
    @section LICENSE
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:
  
    Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  
    Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  
    Neither the name of the project's author nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.
  
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    _AS IS_ AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
    FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
    TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
    LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
    NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// var tileColors = ['red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple'];
var tileColors = new Array("#ffc000", "#a0a0a0", "#ff0000", "#0000a0", "#505050",
                           "#e0f0e0", "#00c080", "#a000a0", "#700000", "#5050f0");

function requestParameter(param, defaultResult) {
  result = defaultResult;
  regex = new RegExp('[?&]'+encodeURIComponent(param)+'=([^&]*)');
  param = regex.exec(location.search);
  if (param) {
    result = decodeURIComponent(param[1]);
  }
  return result;
}

function getOrder() {
  order = parseInt(requestParameter('order', tileColors.length));
  if (order>tileColors.length) {
    order = tileColors.length;
  }
  return order;
}

function getDimX() { return window.innerWidth - 20; }
function getDimY() { return window.innerHeight - 68; }

function getBoardSize() {
  dimX = getDimX();
  dimY = getDimY() * 3 / 4;
  return dimX<dimY ? dimX : dimY;
}

function getSpareHeight(boardSize) {
  return getDimY() - boardSize;
}

var canvas;
var ctx;

var order = getOrder();
var boardSize;
var spareHeight;
var tileSize;
var halfTileSize;
var quarterTileSize;

var xRel = 0.5;
var yRel = 0.5;
var dragTile = null;
var dragPosX = 100;
var dragPosY = 100;

var tile = new Array(order*order);

for(var x=0; x<order; x++) {
  for(var y=0; y<order; y++) {
    tile[x + order * y] = new Tile(x, y, tileColors[x], tileColors[y]);
  }
}

function Tile(x, y, colorFrame, colorInner) {
  this.colorFrame = colorFrame;
  this.colorInner = colorInner;
  this.boardX = x;
  this.boardY = y;
}

Tile.prototype.set = function(x, y) {
  this.boardX = x;
  this.boardY = y;
}

Tile.prototype.getX = function() {
  return tileSize * this.boardX;
};

Tile.prototype.getY = function() {
  return tileSize * this.boardY;
};

Tile.prototype.draw = function() {
  this.drawPos(this.getX(), this.getY());
};

Tile.prototype.drawPos = function(x, y) {
  ctx.beginPath();
  ctx.fillStyle = this.colorFrame;
  ctx.rect( x, y, tileSize, tileSize);
  ctx.fill();
  ctx.lineWidth="1";
  ctx.strokeStyle="#000";
  ctx.stroke();
  ctx.closePath();
  ctx.beginPath();
  ctx.fillStyle = this.colorInner;
  ctx.rect( x + quarterTileSize,
    y + quarterTileSize, halfTileSize, halfTileSize);
  ctx.fill();
  ctx.lineWidth="1";
  ctx.strokeStyle="#000";
  ctx.stroke();
  ctx.closePath();
};

Tile.prototype.matchesPosition = function(x, y) {
  return x < this.getX() + tileSize && x > this.getX() &&
    y < this.getY() + tileSize && y > this.getY();
}

function rect( x, y, w, h, fillColor, stroke) {
  ctx.beginPath();
  ctx.fillStyle = fillColor;
  ctx.rect( x, y, w, h);
  ctx.fill();
  if (stroke) {
    ctx.lineWidth="1";
    ctx.strokeStyle="#000";
    ctx.stroke();
  }
  ctx.closePath();
}

function clear() {
  ctx.clearRect(0, 0, boardSize, boardSize + spareHeight);
}

function draw() {
  clear();
  rect(0, 0, boardSize, boardSize + spareHeight, "#FAF7F8", true);
  rect(0, boardSize, boardSize, spareHeight, "#ccc", true);
  for(var i=0; i<tile.length; i++) {
    tile[i].draw();
  }
  if (null != dragTile) {
    dragTile.drawPos(dragPosX, dragPosY);
  }
}

function grid() {
  ctx.beginPath();
  ctx.lineWidth="1";
  ctx.strokeStyle="red";
  ctx.rect(0,0,50,50);
  ctx.rect(50,0,50,50);
  ctx.rect(100,0,50,50);
  ctx.rect(150,0,50,50);
  ctx.rect(200,0,50,50);
  ctx.rect(250,0,50,50);
  ctx.rect(300,0,50,50);
  ctx.rect(350,0,50,50);
  ctx.rect(400,0,50,50);
  ctx.closePath();
  ctx.stroke();
}

function getTileMatching(evt) {
  evtX = evt.pageX - canvas.offsetLeft;
  evtY = evt.pageY - canvas.offsetTop;
  result = null;
  newTile = new Array();
  for(var i=tile.length-1; i>=0; --i) {
    if( null == result &&
      tile[i].matchesPosition(evtX, evtY)) {
      result = tile[i];
    }
    else {
      newTile[newTile.length] = tile[i];
    }
  }
  tile = new Array();
  for(var i=newTile.length-1; i>=0; --i) {
    tile[tile.length] = newTile[i];
  }
  return result;
}

function handlerMove(evt) {
  if (null != dragTile){
    dragPosX = evt.pageX - canvas.offsetLeft - halfTileSize;
    dragPosY = evt.pageY - canvas.offsetTop - halfTileSize;
  }
  draw();
}

function mouseMove(evt) {
  handlerMove(evt);
}

function touchMove(evt) {
  handlerMove(evt.touches[0]);
}

function handlerSelect(evt, fkt) {
  evtX = evt.pageX - canvas.offsetLeft;
  evtY = evt.pageY - canvas.offsetTop;
  if (null == dragTile) {
    dragTile = getTileMatching(evt);
    if (null != dragTile) {
      dragPosX = evtX - halfTileSize;
      dragPosY = evtY - halfTileSize;
      if (fkt == mouseMove) canvas.onmousemove = fkt;
      if (fkt == touchMove) canvas.ontouchmove = fkt;
    }
  }
  draw();
}

function mouseDown(evt) {
  handlerSelect(evt, mouseMove);
}

function touchStart(evt) {
  handlerSelect(evt.touches[0], touchMove);
}

function handlerRelease() {
  x = dragPosX / tileSize;
  y = dragPosY / tileSize;
  xRound = Math.round(x);
  yRound = Math.round(y);
  if (0 <= xRound && xRound <= order && 0 <= yRound && yRound < order) {
    if(xRound == order) xRound = order - 1;
    if(yRound == order) yRound = order - 1;
    dragTile.set(xRound, yRound);
  }
  else if (0 <= xRound && xRound <= order && yRound >= order) {
    if (y < order + 0.2) y = order + 0.2;
    if (x < 0) x = 0;
    if (x > order - 1) x = order - 1;
    yMax = (boardSize + spareHeight) / tileSize;
    if (y >= yMax) y = yMax - 0.5;
    dragTile.set(x, y);
  }
  tile[tile.length] = dragTile;
  dragTile = null;
  draw();
}

function mouseUp() {
  handlerRelease();
  canvas.onmousemove = null;
}

function touchEnd() {
  handlerRelease();
  canvas.ontouchmove = null;
}

function resize() {
  boardSize = getBoardSize();
  spareHeight = getSpareHeight(boardSize);
  tileSize = boardSize / order;
  halfTileSize = tileSize >> 1;
  quarterTileSize = tileSize >> 2;
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  ctx.canvas.width = boardSize + 1;
  ctx.canvas.height = (boardSize + spareHeight);
  draw();
}

resize();
canvas.onmousedown = mouseDown;
canvas.ontouchstart = touchStart;
canvas.onmouseup = mouseUp;
canvas.ontouchend = touchEnd;
window.onresize = resize;
