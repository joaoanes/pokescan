require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var schedule = require('node-schedule');
var bodyParser = require('body-parser');

var scanQueue = require('./routes/scanQueue.js')
var pokeMongo = require('./routes/pokeMongo.js')
pokeMongo = new pokeMongo()

var routes = require('./routes/index');
var locations = require('./routes/locations');
var scans = require('./routes/scans');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/locations', locations);
app.use('/scans', scans)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

console.log("Hello!")

var rule = new schedule.RecurrenceRule();
rule.second = 30;
schedule.scheduleJob(rule, function(){

    pokeMongo.getAllScanningLocations().then(function(res){
      res.forEach(function(loc)
      {
        console.log("starting scanner for " + loc.location)
        scanQueue.start_scan(loc)
      })
    }).catch((e) => {
      debugger

    })
});

module.exports = app;
