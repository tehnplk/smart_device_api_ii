var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')


router.post('/post_data_bmi', async function (req, res, next) {
    data = req.body
    var _now = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log(_now + 'post_data_bmi')
    console.log(data)

    if (config.his == 'hosxp') {
        r = await knex('opdscreen')
            .where('vn', '=', data.vn)
            .update({
                bw: data.data.bw,
                height: Math.ceil(data.data.bh),
                bmi: data.data.bmi
            })
        console.log(r)
        await knex.raw('UNLOCK TABLES')
        res.json(r)

    }



    if (config.his == 'jhcis') {
        r = await knex('visit')
            .where('visitno', '=', data.vn)
            .update({
                weight: data.data.bw,
                height: Math.ceil(data.data.bh),
            })
        console.log(r)
        res.json(r)
    }

});

router.post('/post_data_bmi_log', async function (req, res, next) {
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
        'bw': data.data.bw,
        'bh': Math.ceil(data.data.bh),
        'bmi': data.data.bmi
    };
    r = await knex('smart_gate_bmi').insert(raw)
    res.json(r)

});




module.exports = router;
