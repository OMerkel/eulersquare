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

function requestParameter(param, defaultResult) {
  result = defaultResult;
  regex = new RegExp('[?&]'+encodeURIComponent(param)+'=([^&]*)');
  param = regex.exec(location.search);
  if (param) {
    result = decodeURIComponent(param[1]);
  }
  return result;
}

// var tileColors = ['red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple'];
var tileColors = new Array("#ffc000", "#a0a0a0", "#ff0000", "#0000a0", "#505050",
                           "#e0f0e0", "#00c080", "#a000a0", "#700000", "#5050f0");
var order = parseInt(requestParameter('size', tileColors.length));
if (order>tileColors.length) {
  order = tileColors.length;
}

function addTile(container, w, h, colorIndexFrame, colorIndexInner) {
  var colorFrame = tileColors[colorIndexFrame];
  var colorInner = tileColors[colorIndexInner];

  var rectFrame = new Kinetic.Rect({
    x: 0,
    y: 0,
    width: w,
    height: h,
    stroke: 'black',
    strokeWidth: 1,
    fill: colorFrame
  });

  container.add(rectFrame);

  var rectInner = new Kinetic.Rect({
    x: w >> 2,
    y: h >> 2,
    width: w >> 1,
    height: h >> 1,
    stroke: 'black',
    strokeWidth: 1,
    fill: colorInner
  });

  container.add(rectInner);
}

var dimX = window.innerWidth - 20;
var dimY = ((window.innerHeight - 52)/ 4) * 3;

var boardSize = dimX<dimY ? dimX : dimY
var spareHeight = boardSize / 3;
var tileSize = boardSize / order;
var halfTileSize = tileSize >> 1;

var stage = new Kinetic.Stage({
  container: 'container',
  width: boardSize,
  height: boardSize + spareHeight,
});
var dragLayer = new Kinetic.Layer();

{
  var layer = new Kinetic.Layer();

  for(var y = 0; y < order; y++) {
    for(var x = 0; x < order; x++) {
      var group = new Kinetic.Group({
        draggable: true,
        x: tileSize * x,
        y: tileSize * y,
      });
      addTile(group,
              boardSize / (order * 1.04), boardSize / (order * 1.04),
              x, y);
      layer.add(group);
    }
  }

  stage.add(layer);
}

stage.add(dragLayer);

stage.on('mousedown touchstart', function(evt) {
  var node = evt.targetNode.getParent();
  var layer = node.getLayer();
  
  node.moveTo(dragLayer);
  layer.draw();
  node.startDrag();
});

stage.on('dragend', function(evt) {
  var node = evt.targetNode.getParent();
  var layer = node.getLayer();
  var mousePos = node.getStage().getMousePosition();
  var newX = Math.floor((node.getAttr('x')+halfTileSize)/tileSize)*tileSize;
  var newY = Math.floor((node.getAttr('y')+halfTileSize)/tileSize)*tileSize;
  if (newX >= boardSize) {
    newX = boardSize - tileSize;
  }
  else if (newX < 0) {
    newX = 0;
  }
  if ( newY < 0) {
    newY = 0;
  }

  if (newY<boardSize) {
    node.setPosition(newX, newY);
  }
  else if(node.getAttr('y') < boardSize + 5){
    node.setAttr('y', boardSize + 5);
  }
  layer.draw();
});
