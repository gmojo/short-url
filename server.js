// where node app starts
var mongodb = require('mongodb');
var express = require('express');
var app = express();

var MongoClient = mongodb.MongoClient;
var mongoURI = process.env.SECRET;

//set static
app.use(express.static('public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


//route for homepage
app.get('/', function(request, response) {
  response.render('index');
});


//route for shortener
app.get('/new/:url(*)',function(req,res){
  //create regex for url validation test
  var regex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
  
  //validate req.params.url and if OK, add new entry to database and display on page as JSON
  if(regex.test(req.params.url)) {
    //connect to mongodb and validate connection
    MongoClient.connect(mongoURI, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
        console.log('Connection established');
        var collection = db.collection('urls');

        //count collection documents for ID number generation
        //once count is returned create a new object and add to the collection
        collection.count()
          .then(function(numItems) {
            var newId = 1000 + numItems + 1;

            var newRequest = {
              'id': newId, 
              'original_url': req.params.url, 
              'short_url': 'https://gmfcc.glitch.me/link/' + newId
            }

            collection.insert(newRequest)
            res.json({'original_url': req.params.url, 'short_url': 'https://gmfcc.glitch.me/link/' + newId})
            db.close();
        })
        
      }
    });
  } else {
    //if url validation fails
    res.json({'error': 'Please provide valid URL in order to shorten it'});
  }
});

//route for redirect
app.get('/link/:id',function(req,res){
  //get url from database with 'id' and redirect
  
  //connect to db and validate connection
  MongoClient.connect(mongoURI, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
        console.log('Connection established');
        var collection = db.collection('urls');
        
        //find id and assign to array
        collection.find({'id': parseInt(req.params.id)})
          .toArray(function(err, urlObj) {
            if(err) {
              throw err;
            }
            res.redirect(301, urlObj[0].original_url)
        })
        
        db.close();
      }
  })
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
