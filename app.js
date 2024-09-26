var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('./config.json')




var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/patient', require('./routes/patient'))
app.use('/bmi', require('./routes/bmi'))
app.use('/tp', require('./routes/tp'))
app.use('/bp', require('./routes/bp'))
app.use('/sp', require('./routes/sp'))

app.use('/service', require('./routes/service'))

app.use('/terminal', require('./routes/terminal'))

app.use('/ovstkey', require('./routes/ovstkey'))
if (config.his == 'hm') {
  app.use('/ipd', require('./routes/ipd_hm'))
} else {
  app.use('/ipd', require('./routes/ipd'))
}

app.use('/test', require('./routes/test'))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
