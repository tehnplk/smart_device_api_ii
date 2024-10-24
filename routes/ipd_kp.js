var express = require('express');
var router = express.Router();
var config = require('../config.json')
var moment = require('moment')
var knex_hos = require('../con_db');
var knex_kp = require('../con_kp');

data_none = {
  'hn': NaN,
  'cid': NaN,
  'fullname': NaN,
  'sex': NaN,
  'an': NaN,
  'birth': '1800-01-01'
}

router.get('/test', async function (req, res, next) {

  sql = `SELECT t.hn,p.cid,concat(p.pname,p.fname,' ',p.lname) fullname,p.sex,p.birthday as birth,t.an 
  from an_stat t INNER JOIN patient p ON t.hn = p.hn  order by t.an DESC  limit 10`
  r = await knex_hos.raw(sql)
  res.json({ 'done': r[0] })

});


router.get('/get_patient_by_hn/:hn', async function (req, res, next) {
  let hn = req.params.hn

  if (config.mode_test) {
    data = {
      'hn': hn,
      'cid': '1111111111111',
      'fullname': 'Mr.TEST TEST HN',
      'sex': 1,
      'an': '',
      'birth': '1980-04-18'
    }
    res.json(data)
    return false
  }

  sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,sex,birthday as birth
  ,(select an from an_stat where hn = '${hn}' order by an DESC limit 1) an
  from patient where hn = '${hn}' limit 1`

  try {
    r = await knex_hos.raw(sql)
  } catch (error) {
    res.json(error)
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
  let an = req.params.an

  if (config.mode_test) {
    data = {
      'hn': '1111111',
      'cid': '1111111111111',
      'fullname': 'Mr.TEST TEST AN',
      'sex': 1,
      'an': an,
      'birth': '1980-04-18'
    }
    res.json(data)
    return false
  }
  if(an=='999999999'){
    data = {
      'hn': '9999999',
      'cid': '999999999999',
      'fullname': 'Mr.TEST TEST AN',
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
    r = await knex_hos.raw(sql)
  } catch (error) {
    res.json(error)
    return false
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
  const now = moment();
  //const _now = now.format('YYYY-MM-DD HH:mm:ss');
  const _now = knex_kp.raw('NOW()') 
  _user_kp = "vs_machine"
  raw = {
    'vs_datetime': _now,
    'hn': data.hn,
    'an': data.an,
    'bt': data.data.tp,
    'pr': data.data.press_pulse,
    'rr': data.data.rr,   
    'sbp': data.data.bps,
    'dbp': data.data.bpd,    
    'sat': data.data.spo2,
    'bw': data.data.weight,
    'height': data.data.height,
    'respirator': 'N',
    'inotrope': 'N',
    'catheter':'N',
    'suction':'N',
    'nb':'N',
    'create_user': _user_kp,
    'update_user': _user_kp,
    'create_datetime': _now,
    'update_datetime': _now,
    'version': 1
  }
  r = await knex_kp('ipd_vs_vital_sign').insert(raw)
  res.json(r)



}); // post_data



module.exports = router;
