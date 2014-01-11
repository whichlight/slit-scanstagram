#! /home/whichlight/.nvm/v0.10.24/bin/node
var phantom = require('phantom'),
  fs = require('fs'),
  exec= require('child_process').exec,
  Tumblr = require('tumblrwks'),
  server = require('node-static'),
  url = require('url'),
  Twit = require('twit'),
  hyperquest = require('hyperquest'),
  request = require('request'),
  util = require('util'),
  config = require('./config.js');

var EMBEDLY_KEY = config.embedly.key;
var imgurl;
var id;
var tweets;
var currentInstagramURL;
var generating;
var fileServer = new server.Server(__dirname);
var image=0;
var finished_img = 0;
var img_size=30;

var tumblr = new Tumblr({
      consumerKey: config.key.consumerKey,
      consumerSecret: config.key.consumerSecret,
      accessToken: config.key.accessToken,
      accessSecret: config.key.accessSecret
    }, config.key.blog);

var T = new Twit({
  consumer_key:  config.twitter.consumerKey,
    consumer_secret: config.twitter.consumerSecret,
    access_token: config.twitter.accessToken,
    access_token_secret: config.twitter.accessTokenSecret
})


error = fs.createWriteStream( __dirname + '/log/node.error.log', { flags: 'a' });
process.stderr.pipe(error);


var app = require('http').createServer(function (req, res) {
  req.addListener('end', function () {
    fileServer.serve(req, res);
  }).resume();
  if (req.method == 'POST') {
      var body = '';
      req.on('data', function (data) {
          body+=data;
      });
      req.on('end', function () {
          console.log('done: '+image);
          body = body.replace("/^data:image\/png;base64,/", "");
          fs.writeFile(__dirname+"/tmp_img/"+image+"_out.png", body, 'base64', function(err) {
             if(err) console.error(err);
	     finished_img++;
             if(finished_img == img_size){
              makeGif();
	     }
           });
           image++;
      });
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('post received');
  }
  if (req.url == '/getimg'){
    res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(currentInstagramURL);
  }
  if (req.url == '/finished'){
    res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('making gif');
  }
}).listen(8082);

var run_ph= function(){
  phantom.create(function(ph){
    ph.createPage(function(page){
      page.set('onConsoleMessage', function (msg) {
        console.log(msg);
      });
      page.open('http://localhost:8082', function (status) {
        console.log("status: "+status);
        console.log('open page');
       });
    });
  });
}

var getInstagram = function(callback){
  T.get('search/tweets', { q: 'instagram sunset', count: 20}, function(err, reply) {
    var tweet = reply.statuses[Math.floor(Math.random()*reply.statuses.length)];
    console.log("tweet: " + tweet.text);
    fullimgurl = tweet.entities.urls[0].expanded_url;
    console.log("full url: " + fullimgurl);
    try{
    id = fullimgurl.match(/(p\/.*)/ig)[0].replace('p/','').slice(0,-1);
    } catch(err){
      sendInstagram();
    }
    embedlyOembed(fullimgurl, function(embed){
        if(embed.type=="photo"){
            var src = embed.url;
            found=true;
            callback(src);
        } else{
            console.log('missed');
            sendInstagram();
        }
    });
  });
}

var parseTextForURL = function(text){
    var re = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
    return text.match(re)[0];
}


var embedlyOembed = function(url, callback){
  var call = "https://api.embed.ly/1/oembed?key="+EMBEDLY_KEY+"&url=";
  var req = request(call+url, function(err, res, body){
    if(!err && res.statusCode == 200){
      var embed = JSON.parse(body);
      callback(embed);
    } else{
      sendInstagram();
    }
  });
}

var sendInstagram= function(){
  getInstagram(function(src){
      console.log("instagram src: " + src);
      filename = __dirname + "/media/" + id +".jpg";
      var r = hyperquest(src);
      r.pipe(fs.createWriteStream(filename))
      r.on("end", function(){
        currentInstagramURL = 'media/'+id+'.jpg';
        console.log("saved img: " + currentInstagramURL);
        run_ph();
      });
    });
}

sendInstagram();

var makeGif = function(){
    var filename = __dirname+'/gifs/' + id +".gif";
    console.log("starting gif: " + id + ".gif");
    var child = exec('bash '+__dirname+'/make_gifs.sh '+filename, function(err, stdout, stderr){
        var removetmp = exec('rm '+__dirname+'/tmp_img/*out.png', function(err, stdout, stderr){
            console.log('gif animation complete');
            postGif(filename);
        });
    });
}

var getRandomElement= function(arr){
  return arr[Math.floor(arr.length*Math.random())]
}

var postGif = function(filename){
  var photo = fs.readFile(filename, function(err,photo){
    if (err) console.error(err);
    //tags
    var source = "http://instagram.com/p/"+id;
    console.log(source);
    var tag_choices= ['lines', 'minimal', 'slit-scan', 'colors',
      'animation', 'instagram', 'calm', 'image processing', 'code art'];
    var random_tag = getRandomElement(tag_choices);
    console.log("random tag: "+random_tag);
    tumblr.post('/post', {
      type: 'photo',
      source: source,
      data: [photo],
      tags: 'gif, '+ random_tag+','+ source
    }, function(err, json){
      console.log(json, err);
      if (err) console.error(err);
      console.log("posted on tumblr");
      var removegif = exec('rm '+filename, function(err, stdout, stderr){
        if (err) console.error(err);
        console.log('deleted gif from hd');
      });
      process.exit();
    });
  });
}
