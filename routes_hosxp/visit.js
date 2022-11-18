var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')


router.post('/post_gen_opdscreen', async function (req, res, next) {
    data = req.body
    var _now  = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log(_now + 'post_data_sp')
    console.log(data)
    r = await knex('opdscreen').insert({
        'hos_guid':null,
        'vn':data.vn,
        'hn':data.hn,
        'vstdate':data.vstdate,
        'vsttime':data.vsttime
    })
    res.json(r)


});


module.exports = router;
