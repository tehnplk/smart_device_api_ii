var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')


router.post('/post_data_tp', async function (req, res, next) {
    data = req.body
    var _now = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log(_now + 'post_data_tp')
    console.log('post data',data)
    if (config.his == 'hosxp') {
        r = await knex('opdscreen')
            .where('vn', '=', data.vn)
            .update({
                temperature: data.data.tp
            })
        res.json(r)
    }


    if (config.his == 'jhcis') {
        r = await knex('visit')
            .where('visitno', '=', data.vn)
            .update({
                temperature: data.data.tp
            })
        res.json(r)
    }

    if (config.his == 'him') {
		console.log('Him',req.body)
		raw = req.body
        let vn = raw.vn;
        let temperature = raw.data.tp

        console.log('POST TP DATA = ', vn, temperature);
		if(!vn){
			res.json({'vn':''})
			return false;
		}

        let p = vn.split('|');
        if (p.length != 3) {
            console.log('No hn.')
            res.json({
                'effect': 0
            })
            return false;
        }
        let hn = p[0];
        let regdate = p[1];
        let frequency = p[2];

        r = await knex('opd')
            .where({
                'hn': hn,
                'regdate': regdate,
                'frequency': frequency
            })
            .update({
                temper: temperature,
            })
        res.json(r)
    }


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
