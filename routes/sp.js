var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')



router.post('/post_data_sp', async function (req, res, next) {
    data = req.body
    var _now = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log(_now + 'post_data_sp')
    console.log(data)
    r = await knex('opdscreen')
        .where('vn', '=', data.vn)
        .update({
            spo2: data.data.sp
        })
    res.json(r)


});

router.post('/post_data_sp_log', async function (req, res, next) {
    data = req.body
    console.log(data)
    raw = {
        'vn': data.vn,
        'cid': data.cid,
        'hn': data.hn,
        'fullname': data.fullname,
        'd_update': moment().format('YYYY-MM-DD HH:mm:ss'),
        'note1': data.data.dep,
        'note2': data.data.staff,
        'note3': data.data.machine,
        'sp': data.data.sp,
        'pulse': data.data.pulse,
    };
    r = await knex('smart_gate_sp').insert(raw)
    res.json(r)
});


module.exports = router;
