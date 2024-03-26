var express = require('express');
var router = express.Router();
var knex = require('../con_db');
var moment = require('moment')
var config = require('../config.json')
var bmsgw = require('../bmsgw.json')
var knex_gw = require('../con_db_bmsgw')
const axios = require('axios');

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


  sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,sex,birthday as birth
  ,(select an from an_stat where hn = '${hn}' order by an DESC limit 1) an
  from patient where hn = '${hn}' limit 1`



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


  sql = `SELECT t.hn,p.cid,concat(p.pname,p.fname,' ',p.lname) fullname,p.sex,p.birthday as birth,t.an 
  from an_stat t INNER JOIN patient p ON t.hn = p.hn
  WHERE t.an = '${an}'`



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
  if (config.mode_test) {
    //res.json(data)
    //return false
  }

  var _now = moment().format('YYYYMMDDHHmmss')
  console.log(_now + 'post_data')
  console.log(data)
  if (config.not_post_if_null_pt & !data.hn) {
    console.log({ 'hn': 'no hn', 'data': data.data })
    //res.json({ 'hn': 'no hn', 'data': data.data })
    //return;
  }

  let hl7 = `MSH|^~\\&|${data.data.machine}|${bmsgw.company}|HIS|BMS-HOSxP|${_now}||ORU^R01|2701|P|2.3\r\n`
            hl7 = hl7 + `PID|1||${data.hn}|\r\n`
            hl7 = hl7 + `PV1||I|||${data.an}||||||||||||||\n`
            hl7 = hl7 + `OBR|1|||||${_now}||||||||${_now}\r\n`
            hl7 = hl7 + `OBX|4|ST|TEMP||${data.data.tp}|C|||||F|||${_now}\r\n`
            hl7 = hl7 + `OBX|5|ST|SYSTOLIC||${data.data.bps}|mmHg|||||F|||${_now}\r\n`
            hl7 = hl7 + `OBX|6|ST|DIASTOLIC||${data.data.bpd}|mmHg|||||F|||${_now}\r\n`
            hl7 = hl7 + `OBX|7|ST|PULSE||${data.data.press_pulse}|bpm|||||F|||${_now}\r\n`

  console.log(hl7)

  raw_data = {
    'scn_result_receive_status': 'N',
    'scn_result_stamp_datetime': _now,
    'scn_result_receive_datetime': _now,
    'scn_result_data': hl7,
    'scn_result_no': data.hn,
    'scn_identify_patient_type': 'hn',
    'scn_result_msg_type': 'ORU^R01'
  }

  try {

    r = await knex_gw('scn_result').insert(raw_data)
    res.json(r)

  } catch (error) {
    res.json(error)
  }



});



module.exports = router;
