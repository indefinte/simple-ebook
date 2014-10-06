
// Copyright 2010 William Malone (www.williammalone.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var canvas;
var context;
var canvasWidth = 960;
var canvasHeight = 600;
//var padding = 25;
var lineWidth = 8;
var colorPurple = "#cb3594";
var colorGreen = "#659b41";
var colorYellow = "#ffcf33";
var colorBrown = "#986928";
var outlineImage = new Image();
var crayonImage = new Image();
var markerImage = new Image();
var eraserImage = new Image();
var crayonBackgroundImage = new Image();
var markerBackgroundImage = new Image();
var eraserBackgroundImage = new Image();
var crayonTextureImage = new Image();
var clickX = new Array();
var clickY = new Array();
var clickColor = new Array();
var clickTool = new Array();
var clickSize = new Array();
var clickDrag = new Array();
var paint = false;
var curColor = colorPurple;
var curTool = "marker";
var curSize = "normal";
var mediumStartX = 18;
var mediumStartY = 19;
var mediumImageWidth = 93;
var mediumImageHeight = 46;

var drawingAreaX = 0;
var drawingAreaY = 0;
var drawingAreaWidth = 960;
var drawingAreaHeight = 600;
/*
var drawingAreaX = 111;
var drawingAreaY = 11;
var drawingAreaWidth = 267;
var drawingAreaHeight = 200;
*/
var toolHotspotStartY = 23;
var toolHotspotHeight = 38;
var sizeHotspotStartY = 157;
var sizeHotspotHeight = 36;
var sizeHotspotWidthObject = new Object();
sizeHotspotWidthObject.huge = 39;
sizeHotspotWidthObject.large = 25;
sizeHotspotWidthObject.normal = 18;
sizeHotspotWidthObject.small = 16;

/**
* Creates a canvas element, loads images, adds events, and draws the canvas for the first time.
*/
function prepareCanvas(){
	var canvas = document.getElementById('canvas');
	if(typeof G_vmlCanvasManager != 'undefined') {
		canvas = G_vmlCanvasManager.initElement(canvas);
	}
	context = canvas.getContext("2d"); // Grab the 2d canvas context
}

function startDraw(){
	//console.log('startDraw');
	
	stopZoom(window.zoom);
	$('#canvas').css('cursor','pointer');	
	
	canvasWidth = window.dW * window.zoom;
	canvasHeight = window.dH * window.zoom;
	drawingAreaWidth = window.dW * window.zoom;
	drawingAreaHeight = (window.dH * window.zoom) - 35;
	
	if(Modernizr.touch){
		// Add touch events	
		$('#canvas').on('touchstart',function(e){
		var touchEvent = e.originalEvent.changedTouches[0];        
		var mouseX = touchEvent.pageX - this.offsetLeft;
		var mouseY = touchEvent.pageY - this.offsetTop;
		
		addClick(mouseX, mouseY, false);
		redraw();
	});
		$('#canvas').on('touchmove',function(e){
		var touchEvent = e.originalEvent.changedTouches[0];
        e.preventDefault();
		addClick(touchEvent.pageX - this.offsetLeft, touchEvent.pageY - this.offsetTop, true);
		redraw();
	});
	}else{	
		// Add mouse events
		// ----------------
		$('#canvas').on('mousedown',function(e){
			// Mouse down location	
			var mouseX = e.pageX - this.offsetLeft;
			var mouseY = e.pageY - this.offsetTop;			
			paint = true;
			//console.log(mouseX + ',' + mouseY);
			addClick(mouseX, mouseY, false);
			redraw();
		});	
		$('#canvas').on('mousemove',function(e){
			if(paint==true){
				//addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
				//console.log((e.pageX - this.offsetLeft) + ',' + (e.pageY - this.offsetTop));
				addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
				redraw();
			}
		});	
		$('#canvas').on('mouseup',function(e){
			paint = false;
			redraw();
		});
		$('#canvas').on('mouseleave',function(e){
			paint = false;
		});
	}
}

function stopDraw(){
	//console.log('stopDraw');
	$('#canvas').css('cursor','auto');
	$('#canvas').off('touchstart touchmove mousedown mousemove mouseup mouseleave');   	

	//ext
	if($('.bTool').hasClass('clk')){
		$('.bTool').removeClass('clk');
		$('.bExt').fadeOut();
	}
}

function startZoom(zoom){
	//console.log('startZoom');	
	
	window.zoom = zoom || 1;
	
	stopDraw();

	prepareCanvasSize();		
	
	$('#canvas').draggable({
		drag: function(event, ui) {
			//console.log('ui.position.left  = ' + ui.position.left );        
			if (ui.position.top > 0) {
				ui.position.top = 0;
			}
			if (ui.position.top < window.nH - $(this).height()) {
				ui.position.top = window.nH - $(this).height();
			}  
			
			if (ui.position.left > 0) {
				ui.position.left = 0;
			}
			if (ui.position.left < window.nW - $(this).width()) {
				ui.position.left = window.nW - $(this).width();
			}    
			$('#page').offset({ top: ui.position.top, left: ui.position.left });
		},
		scroll: false,
		disable: false
	});
	/*
	$('body').bind('swipeone',function(){
		console.log('swipeone');
	});
	$('body').on('swipeleftdown',function(){
		console.log('swipeleft');
	});
	$('body').on('swiperightdown',function(){
		console.log('swiperight');
	});
	*/

	if(window.zoom == 1){
		$('#page').offset({ top: 0, left: 0 });
		$('#canvas').offset({ top: 0, left: 0 });
		//console.log('zoomOut');
	}
	//reload with resize 
	loadCanvas();
}

function stopZoom(zoom){
	//console.log('stopZoom');
	
	window.zoom = zoom || 1;
	
	prepareCanvasSize();	
	
	//remove ctrl
	$('#canvas').draggable('destroy');	
	//$('body').off('swipeone swipeleft swipeleftdown swipeleftup swiperight swiperightdown swiperightup');	
		
	//reload with resize 
	loadCanvas();
}

/**
* Adds a point to the drawing array.
* @param x
* @param y
* @param dragging
*/
function addClick(x, y, dragging)
{
	clickX.push(x);
	clickY.push(y);
	clickTool.push(curTool);
	clickColor.push(curColor);
	clickSize.push(curSize);
	clickDrag.push(dragging);
}

/**
* Clears the canvas.
*/
function clearCanvas()
{	
	context.clearRect(0, 0, canvasWidth, canvasHeight);
}

function resetCanvas()
{
	clickX = new Array();
	clickY = new Array();
	clickColor = new Array();
	clickTool = new Array();
	clickSize = new Array();
	clickDrag = new Array();
	clearCanvas();
}
/**
* Redraws the canvas.
*/
function redraw()
{
	var locX;
	var locY;
	
	// Keep the drawing in the drawing area
	context.save();
	context.beginPath();
	context.rect(drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
	context.clip();

	
	var radius;
	var i = 0;
	for(; i < clickX.length; i++)
	{		
		if(clickSize[i] == "small"){
			radius = 2;
		}else if(clickSize[i] == "normal"){
			radius = 5;
		}else if(clickSize[i] == "large"){
			radius = 10;
		}else if(clickSize[i] == "huge"){
			radius = 20;
		}else{
			alert("Error: Radius is zero for click " + i);
			radius = 0;	
		}
		
		//console.log('radius = ' + radius);
		
		context.beginPath();
		if(clickDrag[i] && i){
			context.moveTo(clickX[i-1], clickY[i-1]);
			//console.log('moveTo = ' + clickX[i-1] +','+ clickY[i-1]);
		}else{
			context.moveTo(clickX[i], clickY[i]);
			//console.log('moveTo = ' + clickX[i] +','+ clickY[i]);
		}
		context.lineTo(clickX[i], clickY[i]);
		//console.log('lineTo = ' + clickX[i] +','+ clickY[i]);
		context.closePath();

		//console.log('clickTool[i] = ' + clickTool[i]);

		if(clickTool[i] == "eraser"){								
			context.globalCompositeOperation = "destination-out"; // To erase instead of draw over with white
			context.fillStyle = "rgba(0,0,0,1)";
			context.strokeStyle = "rgba(0,0,0,1)";			
		}else{
			context.globalCompositeOperation = "source-over";	// To erase instead of draw over with white
			context.strokeStyle = clickColor[i];
		}
		context.lineJoin = "round";
		context.lineWidth = radius * window.zoom;
		context.stroke();
		
	}

	//context.globalCompositeOperation = "source-over";// To erase instead of draw over with white
	context.restore();
	
	// Overlay a crayon texture (if the current tool is crayon)
	if(curTool == "crayon"){
		context.globalCompositeOperation = "source-atop";
		context.globalAlpha = 0.4; // No IE support
		context.drawImage(crayonTextureImage, 0, 0, canvasWidth, canvasHeight);
	}
	context.globalAlpha = 1; // No IE support

}


