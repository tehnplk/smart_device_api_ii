var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')
var bmsgw = require('../bmsgw.json')
var knex_gw = require('../con_db_bmsgw');
const { is } = require('express/lib/request');
const axios = require('axios');



router.post('/post_data_sp', async function (req, res, next) {
    data = req.body
    var _now = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log(_now + 'post_data_sp')
    console.log(data)

    if (config.mode_test) {
        res.json(data)
        return false
    }

    if (config.his == 'ihealth') {
        body_data = {
            "cid": data.cid,
            "vn": data.vn,
            "device_data": { spo2: data.data.sp ,pulse:data.data.pulse }
        }
        n = await axios.post(`${config.ihealth_api}`, body_data, {
            headers: {
                'Authorization': `${config.ihealth_token}`
            }
        })
        console.log("iHealth Response ", n.status)
        res.json(n.status, data)
        return false
    }

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
