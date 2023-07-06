var express = require('express');
var router = express.Router();
var version = require('../version')
var config = require('../config.json')
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Smart Device API 2', ver: version.version() ,test:config.mode_test});
});

module.exports = router;
