var express = require('express');
var router = express.Router();
var knex = require('../con_db');
var moment = require('moment')
var config = require('../config.json')
var bmsgw = require('../bmsgw.json')
var knex_gw = require('../con_db_bmsgw')
const axios = require('axios');
const _view = config.hosxp_patient_view_name;

data_none = {
  'hn': NaN,
  'cid': NaN,
  'fullname': NaN,
  'sex': NaN,
  'an': NaN,
  'birth': '1800-01-01'
}
router.get('/test', async function (req, res, next) {
  if (config.mode_test) {
    res.json({ 'mode_test': true })
    return false
  }

  if (config.his == 'ihealth') {
    res.json({ 'his': 'ihealth' })
    return false
  }


  sql = "select an , hn , regdate from an_stat order by an DESC limit 1"

  if (config.hosxp_patient_view) {

    sql = `select an , hn , regdate from ${_view} order by an DESC limit 1`
  }


  try {
    r = await knex.raw(sql)
  } catch (error) {
    res.json(error)
    return false
  }


  if (config.db.client == 'pg') {
    r[0] = r.rows;
  }

  data = {
    'test': 'SUCCESS',
    'hn': r[0][0].hn,
    'an': r[0][0].an,
    'regdate': r[0][0].regdate
  }
  console.log(data)
  res.json(data)

})

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

  if (config.his == 'ihealth') {

    data = {
      'hn': hn,
      'cid': hn,
      'fullname': hn,
      'sex': 1,
      'an': hn,
      'birth': '1980-04-18'
    }
    res.json(data)
    return false

  } // ihealth


  sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,sex,birthday as birth
  ,(select an from an_stat where hn = '${hn}' order by an DESC limit 1) an
  from patient where hn = '${hn}' limit 1`
  if (config.hosxp_patient_view) {
    sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,if(sex_name='ชาย','1','2') as sex,birthday as birth,an
          from ${_view} where hn = '${hn}' order by an DESC limit 1`
  }



  try {
    r = await knex.raw(sql)
  } catch (error) {
    res.json(error)
    return false
  }

  if (config.db.client == 'pg') {
    r[0] = r.rows;
  }

  if (!r[0][0]) {
    res.json(data_none)
    return false
  }
  console.log(r[0][0])
  data = {
    'hn': r[0][0].hn,
    'cid': r[0][0].cid,
    'fullname': r[0][0].fullname,
    'sex': r[0][0].sex,
    'an': r[0][0].an,
    'birth': r[0][0].birth
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

  if (config.his == 'ihealth') {

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




  sql = `SELECT t.hn,p.cid,concat(p.pname,p.fname,' ',p.lname) fullname,p.sex,p.birthday as birth,t.an 
  from an_stat t INNER JOIN patient p ON t.hn = p.hn
  WHERE t.an = '${an}'`

  if (config.hosxp_patient_view) {
    sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,if(sex_name='ชาย','1','2') as sex,birthday as birth,an
          from ${_view} where an = '${an}'`
  }



  try {
    r = await knex.raw(sql)
  } catch (error) {
    res.json(error)
    return false
  }

  if (config.db.client == 'pg') {
    r[0] = r.rows;
  }

  if (!r[0][0]) {
    res.json(data_none)
    return false
  }
  console.log(r[0][0])
  data = {
    'hn': r[0][0].hn,
    'cid': r[0][0].cid,
    'fullname': r[0][0].fullname,
    'sex': r[0][0].sex,
    'an': r[0][0].an,
    'birth': r[0][0].birth
  }
  res.json(data)
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
