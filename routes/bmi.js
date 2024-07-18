var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')
var bmsgw = require('../bmsgw.json')
var knex_gw = require('../con_db_bmsgw')
const axios = require('axios');


router.post('/post_data_bmi', async function (req, res, next) {
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
            "device_data": {
                weight:data.data.weight,
                height:data.data.height,
                bmi:data.data.bmi
            }
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
    console.log(_now + 'post_data_bmi')
    console.log(data)
    if (config.not_post_if_null_pt & !data.hn) {
        console.log({ 'hn': 'no hn', 'data': data.data })
        res.json({ 'hn': 'no hn', 'data': data.data })
        return;
    }
    if (config.his == '้him') {
        res.json({'resp':'try add to him.'})
        retu
    }

    if (bmsgw.active) {
        try {
            let hl7 = `MSH|^~\\&|${data.data.machine}|${bmsgw.company}|HIS|BMS-HOSxP|${_now}||ORU^R01|2701|P|2.3\r\n`
            hl7 = hl7 + `PID|1||${data.hn}|\r\n`
            hl7 = hl7 + `PV1|||||||||||||||||||\n`
            hl7 = hl7 + `OBR|1|||||${_now}||||||||${_now}\r\n`
            hl7 = hl7 + `OBX|1|ST|WEIGHT||${data.data.weight}|Kg|||||F|||${_now}\r\n`
            hl7 = hl7 + `OBX|2|ST|HEIGHT||${data.data.height}|cm|||||F|||${_now}\r\n`
            hl7 = hl7 + `OBX|3|ST|BMI||${data.data.bmi}|kb/m2|||||F|||${_now}\r\n`


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
                        bw: data.data.weight,
                        height: Math.ceil(data.data.height),
                        bmi: data.data.bmi
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
                        weight: data.data.weight,
                        height: Math.ceil(data.data.height),
                    })
                console.log(r)
                res.json(r)
            } catch (error) {
                res.json(error)
            }

        }

        if (config.his == 'him') {            

            console.log('Him', req.body)
            raw = req.body
            let vn = raw.vn;
            let high = raw.data.weight
            let weight = raw.data.height
            let bmi = raw.data.bmi

            console.log('POST BMI DATA = ', vn, high,weight,bmi);
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
                        high: high,
                        weight:weight,
                        bmi:bmi
                    })
                res.json(r)
            } catch (error) {
                res.json(error)
            }
            return;

        }
           

    }



});

router.post('/post_data_bmi_log', async function (req, res, next) {
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
        'bw': data.data.weight,
        'bh': Math.ceil(data.data.height),
        'bmi': data.data.bmi
    };
    try {
        r = await knex('smart_gate_bmi').insert(raw)
        res.json(r)
    } catch (error) {
        res.json(error)
    }


});

router.post('/post_data_bmi_log2', async function (req, res, next) {
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



    try {
        r = await knex('smart_gate_bmi').insert(data)
        res.json(r)
    } catch (error) {
        res.json(error)
    }


});




module.exports = router;
