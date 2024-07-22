var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')
var bmsgw = require('../bmsgw.json')
var knex_gw = require('../con_db_bmsgw');
const { is } = require('express/lib/request');
const axios = require('axios');

router.post('/post_data_tp', async function (req, res, next) {
    data = req.body
    console.log(data)

    if (config.mode_test) {
        res.json(data)
        return false
    }

    if (config.his == 'ihealth') {
        body_data = {
            "cid": data.cid,
            "vn": data.vn,
            "device_data": { tp: data.data.tp }
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

    var _now = moment().format('YYYYMMDDHHmmss')
    console.log(_now + 'post_data_tp')
    console.log('post data', data)
    if (config.not_post_if_null_pt & !data.hn) {
        console.log({ 'hn': 'no hn', 'data': data.data })
        res.json({ 'hn': 'no hn', 'data': data.data })
        return;
    }

    if (bmsgw.active) {
        try {
            let hl7 = `MSH|^~\\&|${data.data.machine}|${bmsgw.company}|HIS|BMS-HOSxP|${_now}||ORU^R01|2701|P|2.3\r\n`
            hl7 = hl7 + `PID|1||${data.hn}|\r\n`
            hl7 = hl7 + `PV1|||||||||||||||||||\n`
            hl7 = hl7 + `OBR|1|||||${_now}||||||||${_now}\r\n`
            hl7 = hl7 + `OBX|4|ST|TEMP||${data.data.tp}|C|||||F|||${_now}\r\n`


            raw_data = {
                'scn_result_receive_status': 'N',
                'scn_result_stamp_datetime': _now,
                'scn_result_receive_datetime': _now,
                'scn_result_data': hl7,
                'scn_result_no': data.hn,
                'scn_identify_patient_type': 'hn',
                'scn_result_msg_type': 'ORU^R01'
            }
            r = await knex_gw('scn_result').insert(raw_data)
            res.json(r)

        } catch (error) {
            res.json(error)
        }
    } else {

        if (config.his == 'hosxp') {
            try {
                r = await knex('opdscreen')
                    .where('vn', '=', data.vn)
                    .update({
                        temperature: data.data.tp
                    })
                res.json(r)
            } catch (error) {
                res.json(error)
            }

        }


        if (config.his == 'jhcis') {
            try {
                r = await knex('visit')
                    .where('visitno', '=', data.vn)
                    .update({
                        temperature: data.data.tp
                    })
                res.json(r)
            } catch (error) {
                res.json(error)
            }

        }

        if (config.his == 'him') {
            console.log('Him', req.body)
            raw = req.body
            let vn = raw.vn;
            let temperature = raw.data.tp

            console.log('POST TP DATA = ', vn, temperature);
            if (!vn) {
                res.json({ 'vn': '' })
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

            try {
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
            } catch (error) {
                res.json(error)
            }

        }

    }




});

router.post('/post_data_tp_log', async function (req, res, next) {
    data = req.body
    console.log(data)

    if (config.mode_test) {
        res.json(data)
        return false
    }

    if (config.his == 'ihealth') {
        res.json(data)
        return false
    }

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
    try {
        r = await knex('smart_gate_tp').insert(raw)
        res.json(r)
    } catch (error) {
        res.json(error)
    }

});


module.exports = router;
