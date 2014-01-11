var imgs = [];
var numFrames = 30;
var slices;

var colArray = new Array();
var canvas, ctx, pixels, pixData;
var dcanvas= document.createElement("canvas");


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

var initIMG = function(source){
  canvas = document.getElementById("canvas");
  var img = new Image();
  img.src=source;
  img.onload = function(){
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    processImage();
  }
}


$(document).ready(function(){
  $.get("/getimg").done(function(res){
      console.log(res);
      initIMG(res);
  })
//  initIMG("media/landscape.jpg");
});
