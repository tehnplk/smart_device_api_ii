var express = require('express');
var router = express.Router();
var config = require('../config.json')
var moment = require('moment')
const axios = require('axios');
const fs = require('fs').promises;


router.get('/test', async function (req, res, next) {

  let data = await fs.readFile('hm_token.txt', 'utf8');
  res.json({ 'done': data })

});

router.get('/gen_hm_token', async function (req, res, next) {
  url_login = "http://188.8.8.2:11600/api/api/userLogin"
  url_checkAuthen = "http://188.8.8.2:11600/api/api/checkAuthen"

  r = await axios.post(url_login, {
    "username": "systemGetApi",
    "password": "0e10b9bf963afb62136c9cb8662f397a"
  })

  console.log(r.data)
  content = r.data.accessToken


  await fs.writeFile('hm_token.txt', content, 'utf8');

  res.json({ 'done': content })
});

router.get('/get_patient_by_hn/:hn', async function (req, res, next) {
  hn = req.params.hn

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

  data = {
    'hn': hn,
    'cid': '',
    'fullname': hn,
    'sex': 1,
    'an': '',
    'birth': '1980-04-18'
  }
  res.json(data)

});



router.get('/get_patient_by_an/:an', async function (req, res, next) {
  an = req.params.an

  if (config.mode_test) {
    data = {
      'hn': '',
      'cid': '1111111111111',
      'fullname': 'Mr.TEST TEST AN',
      'sex': 1,
      'an': an,
      'birth': '1980-04-18'
    }
    res.json(data)
    return false
  }

  data = {
    'hn': '',
    'cid': '',
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
  const now = moment();

  const _now = now.format('YYYY-MM-DD HH:mm:ss');

  let _token = await fs.readFile('hm_token.txt', 'utf8')

  payload = {
    "client": "http://188.8.8.2:11600",
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
  let r = await axios.post('http://188.8.8.2:11600/api/api/saveIpdTemp', payload, header_config)
  console.log(r.data)
  res.json(r.data)


}); // post_data



module.exports = router;
