var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')
var bmsgw = require('../bmsgw.json')
var knex_gw = require('../con_db_bmsgw')



router.post('/post_data_bmi', async function (req, res, next) {
    data = req.body
    var _now = moment().format('YYYYMMDDHHmmss')
    console.log(_now + 'post_data_bmi')
    console.log(data)

    if (bmsgw.active) {
        try {
            let hl7 = `MSH|^~\\&|${data.data.machine}|${bmsgw.company}|HIS|BMS-HOSxP|${_now}||ORU^R01|2701|P|2.3\r\n`
            hl7 = hl7 + `PID|1||${data.hn}|\r\n`
            hl7 = hl7 + `PV1|||||||||||||||||||\n`
            hl7 = hl7 + `OBR|1|||||${_now}||||||||${_now}\r\n`
            hl7 = hl7 + `OBX|1|ST|WEIGHT||${data.data.bw}|Kg|||||F|||${_now}\r\n`
            hl7 = hl7 + `OBX|2|ST|HEIGHT||${data.data.bh}|cm|||||F|||${_now}\r\n`
            hl7 = hl7 + `OBX|3|ST|BMI||${data.data.bmi}|kb/m2|||||F|||${_now}\r\n`


            raw_data = {
                'scn_result_receive_status':'C',
                'scn_result_stamp_datetime':_now,
                'scn_result_receive_datetime':_now,
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
                        bw: data.data.bw,
                        height: Math.ceil(data.data.bh),
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
                        weight: data.data.bw,
                        height: Math.ceil(data.data.bh),
                    })
                console.log(r)
                res.json(r)
            } catch (error) {
                res.json(error)
            }

        }

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
    try {
        r = await knex('smart_gate_bmi').insert(data)
        res.json(r)
    } catch (error) {
        res.json(error)
    }


});




module.exports = router;
