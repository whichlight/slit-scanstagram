var imgs = [];
var numFrames = 30;
var slices;

var colArray = new Array();
var canvas, ctx, pixels, pixData;
var dcanvas= document.createElement("canvas");
var blurRadius = 100;


var slitScanIMG= function(x){
  var dctx = dcanvas.getContext('2d');
  var dpixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var dpixData = dpixels.data;
  for (j = 0; j < canvas.height; j++) {
    var index = (j*canvas.width+(x))*4;
    var r = pixData[index];
    var g = pixData[index+1];
    var b = pixData[index+2];
    //var alpha = pixData[index+3];
    for (i = 0; i < canvas.width; i++) {
      var bindex = (j*canvas.width+(i))*4;
      dpixData[bindex] = r;
      dpixData[bindex+1] = g;
      dpixData[bindex+2] = b;
      //pixData[index+3];
    }
  }
  dpixels.data = dpixData;
  dctx.putImageData(dpixels, 0, 0);
  var img = dcanvas.toDataURL()
  uploadImage(img);
}

var uploadImage = function(img){
  var png = img.split(',')[1];
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/', true);
  xhr.setRequestHeader("Content-Type", 'image/png');
  xhr.send(png);
}

var processImage = function() {
  dcanvas.width = canvas.width
  dcanvas.height= canvas.height
  ctx = canvas.getContext('2d');
  pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixData = pixels.data;

  var x=0;
  var interval = Math.floor(canvas.width/numFrames);
  for(var f=0; f<numFrames; f++){
    slitScanIMG(x);
    x+=interval;
    if(f==numFrames-1){
      $.get("/finished").done(function(res){
        console.log(res);
      })
    }
  }
}

var average = function(arr){
  return arr.reduce(function(a,b){return a+b})/arr.length;
}


var blurHorizontal = function(radius){
   ctx = canvas.getContext('2d');
  pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixData = pixels.data;
  var blurData = new Array();
  pixColorLen = pixData.length/4;


  for(var i =0; i<pixData.length; i++){
   blurData[i]=pixData[i];
  }

  for(var i =0; i<pixColorLen; i++){
    var r = [];
    var g = [];
    var b = [];
    for(var k = -1*radius; k<radius; k++){
      var index=i+k;
      if(index<0){
        index += pixColorLen;
      } else if(index>(pixColorLen)) {
        index-=(pixColorLen);;
      }
      r.push(pixData[4*index]);
      g.push(pixData[4*index+1]);
      b.push(pixData[4*index+2]);
    }
    blurData[4*i]=Math.floor(average(r));
    blurData[4*i+1]=Math.floor(average(g));
    blurData[4*i+2]=Math.floor(average(b));
  }

  for(var i =0; i<pixData.length; i++){
    pixData[i]=blurData[i];
  }
  pixels.data = pixData;
  ctx.putImageData(pixels, 0, 0);
}

var initIMG = function(source){
  canvas = document.getElementById("canvas");
  var img = new Image();
  img.src=source;
  img.onload = function(){
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    //stackBlurCanvasRGBA('canvas',0,0,canvas.width,canvas.height,10);
    blurHorizontal(blurRadius);
    processImage();
  }
}


$(document).ready(function(){
  $.get("/getimg").done(function(res){
      console.log(res);
      initIMG(res);
  })
  //initIMG("media/landscape.jpg");
});
