var express = require('express');
var app = express();
var validUrl = require('valid-url');
var mongoose = require('mongoose');
//url hidden according to the wiki
var dburl = process.env.MONGOLAB_URI; //https://github.com/FreeCodeCamp/FreeCodeCamp/wiki/Using-MongoDB-And-Deploying-To-Heroku
//SET MONGOLAB_URI="mongodb://username:password@ds01316.mlab.com:1316/food" The quotes are wrong (the correct format is without the quotes)
console.log(dburl);
mongoose.connect(dburl); //mlab db url

var Schema = mongoose.Schema;
var PORT = process.env.PORT || 3000; //for deploying in heroku
var urlDataSchema = new Schema({
    longurl: String,
    shorturl:Number
});

var urlData = mongoose.model('urlData', urlDataSchema );

var numberArray = [];

for(var i = 1; i <= 9999; i++){
    numberArray.push(i);
}
function UrlChecker(url){
    if (validUrl.isUri(url)){
        return ('Looks like an URI');
    } else {
        return('Incorrect url');
    }
};    
//Express handles routes:
app.get('/', function(req,res){
    res.sendFile((__dirname+'/index.html'));
});

//handle the favicon requests
app.get('/favicon.ico', function(req,res){
    return;
});

app.get( '/:number', function(req,res){
    var argument = req.params.number;
    if ( isFinite(argument) ){
urlData.findOne({ 'shorturl': argument }, function (err, data) {
  if (err) {console.log(err)}
  else if ( data !== null )  {res.redirect(data.longurl)}
  else { res.redirect('/') }    
});    
    }
} );

app.all('*', function (req, res){
    var slUrl = req.url.slice(5); 
    
    if ( UrlChecker(slUrl) ==='Looks like an URI' && ( slUrl.indexOf('https:') >-1 || slUrl.indexOf('http:') >-1)   ) {  
        console.log('looks like a valid url');
 
//The function finds a random number that hasn't been already included in the database    
var randomNumber = function () {   
    return new Promise(function(resolve, reject){
    var randomN = numberArray[Math.floor(Math.random()*numberArray.length)];
    urlData.findOne({'shorturl' : randomN}, function (err,data){
        
        if (err) {console.log('error')}
        else if ( (data != null) )  {console.log('New loop'); //Code runs when the number already exists in the db
                                     resolve (randomNumber());//<-- Very important line   
                                    }
        //else runs when the random number hasn't been selected in the past
        else { 
            flag = 'stop loop';    
            var index = numberArray.indexOf(randomN);
                numberArray.splice(index, 1);
              resolve (randomN);              
             }
    });  
    });
}    
    var createItem = function(num){
    return    new Promise (function (resolve,reject){
            var item = {
        longurl:slUrl,
        shorturl:num}
        var data = new urlData(item); 
            resolve(data);
    });
    };
    
        var saveData = function(item){
        return new Promise (function(resolve, reject){
            item.save();
            resolve(item);
        });
        }
        
        var sendData = function(item){ 
     return   new Promise (function(resolve,reject){
         res.send({"original_url":item.longurl,
                   "short_url":"https://npap-shorturl.herokuapp.com/" + item.shorturl
                  });      
//         urlData.find()         <-- uncomment these 4 lines to get all the collection entries
//        .then(function(doc){
//        res.send({items:doc});
//    });
    resolve();
     
     
     });    
    };
    
        randomNumber().then(function(num){
            return createItem(num);
        }).then(function(item){
            return saveData(item);
        }).then(function(item){
            return sendData(item);
        }).catch(console.log.bind(console)); //<-- https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html

    }
    else {res.send({"error":"Wrong url format, make sure you have a valid protocol and real site."})}       
});


app.listen(PORT, function(){
    console.log('Express listening on port '+ PORT + '!');
});