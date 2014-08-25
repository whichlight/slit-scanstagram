var imgs = [];
var numFrames = 100;
var slices;
var imageData;

var colArray = new Array();
var canvas, ctx, pixels, pixData;
var dcanvas= document.createElement("canvas");
var blurRadius = 30;


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

  var blurArray = [];
  for(var i=0; i<(pixData.length/4); i++){
    colArray[i] = [pixData[4*i], pixData[4*i+1], pixData[4*i+2], pixData[4*i+3]];
    blurArray[i] = [pixData[4*i], pixData[4*i+1], pixData[4*i+2], pixData[4*i+3]];
  }

  for(var j=0; j<(canvas.height); j++){
    for(var i=0; i<(canvas.width); i++){
      var r = [];
      var g = [];
      var b = [];
      if(i>0){
        for(var k=0; k<Math.min(radius,i); k++){
          r.push(colArray[j*canvas.width+i-k][0]);
          g.push(colArray[j*canvas.width+i-k][1]);
          b.push(colArray[j*canvas.width+i-k][2]);
        }
        blurArray[j*canvas.width+i][0]=Math.floor(average(r));
        blurArray[j*canvas.width+i][1]=Math.floor(average(g));
        blurArray[j*canvas.width+i][2]=Math.floor(average(b));
      }
      else{
        blurArray[j*canvas.width+i]=colArray[j*canvas.width+i];
      }
    }
  }

  for(var i=0; i<(pixData.length/4); i++){
    pixData[4*i]=blurArray[i][0];
    pixData[4*i+1]=blurArray[i][1];
    pixData[4*i+2]=blurArray[i][2];
    pixData[4*i+3]=blurArray[i][3];
  }
  ctx.putImageData(pixels,0,0);


  /*
  for(var i =0; i<pixData.length; i++){
   blurData[i]=pixData[i];
  }

  for(var i =0; i<pixColorLen; i++){
    var r = [];
    var g = [];
    var b = [];
    for(var k = -radius; k<radius; k++){
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
  */
  pixels.data = pixData;
  ctx.putImageData(pixels, 0, 0);
}

var brightness = function(R,G,B){
    return (0.299*R + 0.587*G + 0.114*B)
}

var sortFxn = function(a,b,fx, arr){
  if(typeof(arr[a])=="undefined"){console.log(a);}
  if(fx(arr[a],arr[b])){
    var c = new Uint8ClampedArray(4);
    c.set(arr[a]);
    arr[a] = arr[b];
    arr[b]=c;
  }
}

var sortVertical = function(){
  ctx = canvas.getContext('2d');
  pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixData = pixels.data;
  for(var i=0; i<(pixData.length/4); i++){
    colArray[i] = [pixData[4*i], pixData[4*i+1], pixData[4*i+2], pixData[4*i+3]];
  }


  for(var i=0; i<(canvas.width); i++){

    var a = new Array();
    for(var j=0; j<(canvas.height); j++){
      a.push(colArray[j*canvas.width+i]);
    }
    a.sort(function(colA,colB){
      var ba = brightness(colA[0],colA[1], colA[2]);
      var bb = brightness(colB[0],colB[1], colB[2]);
      // var ba = colA[2];
      // var bb = colB[2];
      var val = bb-ba;
      if (Math.abs(val) <0.5){ val=1;}
      return val;
    });
    for(var j = 0; j < canvas.height; j++){
      colArray[j*canvas.width+i]=a[j];
    }

  }
/*
   colArray.sort(function(colA,colB){
         var ba = brightness(colA[0],colA[1], colA[2]);
         var bb = brightness(colB[0],colB[1], colB[2]);
       //  var ba = colA[0]+ colA[1] +colA[2];
     //    var bb = colB[0] + colB[1] + colB[2];
         return bb-ba;
       });

*/


  for(var i=0; i<(pixData.length/4); i++){
    pixData[4*i]=colArray[i][0];
    pixData[4*i+1]=colArray[i][1];
    pixData[4*i+2]=colArray[i][2];
    pixData[4*i+3]=colArray[i][3];
  }
  ctx.putImageData(pixels,0,0);
}


var sortHorizontal = function(){
  ctx = canvas.getContext('2d');
  pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixData = pixels.data;
  for(var i=0; i<(pixData.length/4); i++){
    colArray[i] = [pixData[4*i], pixData[4*i+1], pixData[4*i+2], pixData[4*i+3]];
  }


  for(var i=0; i<(colArray.length/canvas.width); i++){
    var a = new Array();
    a = colArray.slice(i*canvas.width,(i+1)*canvas.width);

    a.sort(function(colA,colB){
         var ba = brightness(colA[0],colA[1], colA[2]);
         var bb = brightness(colB[0],colB[1], colB[2]);
    //     var ba = colA[0];
     //    var bb = colB[0];
         var val = bb-ba;
         if (Math.abs(val) <0.5){ val=1;}
         return val;
       });
    for(var j = 0; j < a.length; j++){
      colArray[i*canvas.width+j]=a[j];
    }

  }
/*
   colArray.sort(function(colA,colB){
         var ba = brightness(colA[0],colA[1], colA[2]);
         var bb = brightness(colB[0],colB[1], colB[2]);
       //  var ba = colA[0]+ colA[1] +colA[2];
     //    var bb = colB[0] + colB[1] + colB[2];
         return bb-ba;
       });

*/


  for(var i=0; i<(pixData.length/4); i++){
    pixData[4*i]=colArray[i][0];
    pixData[4*i+1]=colArray[i][1];
    pixData[4*i+2]=colArray[i][2];
    pixData[4*i+3]=colArray[i][3];
  }
  ctx.putImageData(pixels,0,0);
}



var brightSort = function(colA,colB){
  var ba = brightness(colA[0],colA[1], colA[2]);
  var bb = brightness(colB[0],colB[1], colB[2]);
  if(ba>bb){
    return true;
    }
  return false;
}

var initIMG = function(source){
  canvas = document.getElementById("canvas");
  var img = new Image();
  img.src=source;
  img.onload = function(){
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    //stackBlurCanvasRGBA('canvas',0,0,canvas.width,canvas.height,10);
    sortVertical();
    //sortHorizontal();
//    blurHorizontal(blurRadius);
    var outimg = canvas.toDataURL();
    uploadImage(outimg);
   // processImage();
  }
}


$(document).ready(function(){
  $.get("/getimg").done(function(res){
     console.log(res);
      initIMG(res);
  })
  //initIMG("media/jBDm5lm4h4.jpg");
});
