var express = require('express');
var router = express.Router();
var config = require('../config.json')
var moment = require('moment')
const axios = require('axios');
const fs = require('fs').promises;





router.get('/test', async function (req, res, next) {
  const content = moment().format('YYYYMMDDhhmmss')
  await fs.writeFile('hm_token.txt', content, 'utf8');
  let data = await fs.readFile('hm_token.txt', 'utf8')
  res.json({ 'token': data })

});

router.get('/gen_hm_token', async function (req, res, next) {
  url_login = "http://ipdpaperless.hosmerge.net:9500/api/userLogin"
  url_checkAuthen = "http://ipdpaperless.hosmerge.net:9500/api/checkAuthen"

  const content = moment().format('YYYYMMDDhhmmss')
  await fs.writeFile('hm_token.txt', content, 'utf8');

  res.json({ 'done': content })
});

router.get('/get_patient_by_hn/:hn', async function (req, res, next) {
  hn = req.params.hn

  if (config.mode_test) {
    data = {
      'hn': '111111111',
      'cid': cid,
      'fullname': 'Mr.TEST TEST',
      'sex': 1,
      'an': '000000000000',
      'birth': '1980-04-18'
    }
    res.json(data)
    return false
  }

  data = {
    'hn': hn,
    'cid': hn,
    'fullname': hn,
    'sex': 1,
    'an': hn,
    'birth': '1980-04-18'
  }
  res.json(data)

});



router.get('/get_patient_by_an/:an', async function (req, res, next) {
  an = req.params.an

  if (config.mode_test) {
    data = {
      'hn': '111111111',
      'cid': '1111111111111',
      'fullname': 'Mr.TEST TEST',
      'sex': 1,
      'an': an,
      'birth': '1980-04-18'
    }
    res.json(data)
    return false
  }

  if (config.his == 'hm') {

    data = {
      'hn': an,
      'cid': an,
      'fullname': an,
      'sex': 1,
      'an': an,
      'birth': '1980-04-18'
    }
    res.json(data)
    return false

  } // ihealth

});



router.post('/post_data', async function (req, res, next) {
  data = req.body
  console.log(data)
  var _now = moment().format('YYYYMMDDHHmmss')

  if (config.his == 'ihealth') {
    if (!data.an) {
      data['an'] = 'x'
    }
    if (!data.cid) {
      data['cid'] = 'x'
    }
    body_data = {
      "cid": data.cid,
      "an": data.an,
      "device_data": {
        bps: data.data.bps,
        bpd: data.data.bpd,
        pulse: data.data.press_pulse,
        tp: data.data.tp,
        spo2: data.data.spo2,
        hr: data.data.hr,
        rr: data.data.rr,
        sos: data.data.sos
      }
    }
    console.log('ihealth_data_ipd', body_data)
    try {
      n = await axios.post(`${config.ihealth_api}`, body_data, {
        headers: {
          'Authorization': `${config.ihealth_token}`
        }
      })
      console.log("iHealth Response ", n.status)
      body_data['ihealth'] = n.data
      res.status(200).json(body_data)

    } catch (error) {
      res.send(error)
    }
    return false
  }


  let hl7 = `MSH|^~\\&|${data.data.machine}|${bmsgw.company}|HIS|BMS-HOSxP|${_now}||ORU^R01|2701|P|2.3\r\n`
  hl7 = hl7 + `PID|1||${data.hn}|\r\n`
  hl7 = hl7 + `PV1||I|||${data.an}||||||||||||||\n`
  hl7 = hl7 + `OBR|1|||||${_now}||||||||${_now}\r\n`
  hl7 = hl7 + `OBX|1|ST|WEIGHT||${data.data.w}|KG.|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|2|ST|HEIGHT||${data.data.h}|CM.|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|3|ST|BMI||${data.data.bmi}| Kg/m2|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|4|ST|TEMP||${data.data.tp}|C|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|5|ST|SYSTOLIC||${data.data.bps}|mmHg|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|6|ST|DIASTOLIC||${data.data.bpd}|mmHg|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|7|ST|RR||${data.data.rr}|RM|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|8|ST|PULSE||${data.data.press_pulse}|bpm|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|9|ST|HEARTRATE||${data.data.hr}|HRM|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|10|ST|SPO2||${data.data.spo2}|%Spo2|||||F|||${_now}\r\n`
  hl7 = hl7 + `OBX|11|ST|SOS_SCORE||${data.data.sos}|Point|||||F|||${_now}\r\n`

  console.log('hl7', hl7)


  if (config.mode_test) {
    res.json(data)
    return false
  }

  if (config.not_post_if_null_pt & !data.hn) {
    console.log({ 'hn': 'no hn', 'data': data.data })
    res.json({ 'hn': 'no hn', 'data': data.data })
    return;
  }



  raw_data = {
    'scn_result_receive_status': 'N',
    'scn_result_stamp_datetime': _now,
    'scn_result_receive_datetime': _now,
    'scn_result_data': hl7,
    'scn_result_no': data.an,
    'scn_identify_patient_type': 'an',
    'scn_result_msg_type': 'ORU^R01'
  }

  try {

    r = await knex_gw('scn_result').insert(raw_data)
    res.json(r)

  } catch (error) {
    console.log(error.errno, error.code)
    res.json(error)
  }



});



module.exports = router;
