var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')


router.post('/post_data_tp', async function (req, res, next) {
    data = req.body
    console.log(data)
    r = await knex('opdscreen')
        .where('vn', '=', data.vn)
        .update({
            temperature: data.data.tp
        })
    res.json(data)


});

router.post('/post_data_tp_log', async function (req, res, next) {
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
        'tp': data.data.tp,
    };
    r = await knex('smart_gate_tp').insert(raw)
    res.json(r)
});


module.exports = router;
