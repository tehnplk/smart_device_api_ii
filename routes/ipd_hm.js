var express = require('express');
var router = express.Router();
var config = require('../config.json')
var moment = require('moment')
const axios = require('axios');
const fs = require('fs').promises;

axios.defaults.baseURL = 'http://localhost:3000';


router.get('/test', async function (req, res, next) {

  const content = moment().format('YYYYMMDDhhmmss')
  await fs.writeFile('hm_token.txt', content, 'utf8');
  let data = await fs.readFile('hm_token.txt', 'utf8')

  n = await axios.post('/test/post', { 'data': data })
  res.json({ 'done': n.data })

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
      'hn': hn,
      'cid': '112233445566',
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



});



router.post('/post_data', async function (req, res, next) {
  data = req.body
  console.log(data)
  var _now = moment().format('YYYY-MM-DD HHmmss')

  let _token = await fs.readFile('hm_token.txt', 'utf8')

  payload = {
    "client": axios.defaults.baseURL,
    "hn": data.hn,
    "visitId": "",
    "an": data.an,
    "vs": {
      "TempC": data.data.tp,
      "PR": data.data.press_pulse,
      "BPMax": data.data.bps,
      "BPMIn": data.data.bpd,
      "RR": data.data.rr,
      "O2Saturation": data.data.spo2,
      "other": "",
      "cannula": "",
      "activeDate": _now
    },
    "weight": {
      "Weight": data.data.weight,
      "Hight": data.data.height,
      "activeDate": _now
    },
    "pain": {
      "PainScore": "",
      "activeDate": ""
    },
    "intakeOutput": {
      "Urine": "",
      "urineInfo": "",
      "Defecation": "",
      "defecationInfo": "",
      "activeDate": ""
    }
  }//payload

  console.log(payload)
  if (config.mode_test) {
    res.json({ 'done': 'test', 'token': _token })
    return;
  }

  header_config = {
    headers: {
      'Authorization': `Bearer ${_token}`
    }
  }
  let r = await axios.post('/api/saveIpdTemp', payload, header_config)
  res.json(r.data)


}); // post_data



module.exports = router;
