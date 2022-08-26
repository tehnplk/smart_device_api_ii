var express = require('express');
var router = express.Router();
var knex = require('../con_db')

data_none = {
  'hn': NaN,
  'cid': NaN,
  'fullname':NaN,
  'sex':NaN,
  'vn': NaN
}

router.get('/get_patient_by_cid/:cid', async function (req, res, next) {
  cid = req.params.cid
  sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,sex
  ,(select vn from vn_stat where vstdate = CURRENT_DATE  and cid = '${cid}' order by vn DESC limit 1) vn 
  from patient where cid = '${cid}' limit 1`
  r = await knex.raw(sql)
  if (!r[0][0]){
    res.json(data_none)
    return false
  }
  console.log(r[0][0])
  data = {
    'hn': r[0][0].hn,
    'cid': r[0][0].cid,
    'fullname': r[0][0].fullname,
    'sex':r[0][0].sex,
    'vn': r[0][0].vn
  }
  res.json(data)
});

router.get('/get_patient_by_hn/:hn', async function (req, res, next) {
  hn = req.params.hn
  sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,sex
  ,(select vn from vn_stat where vstdate = CURRENT_DATE  and hn = '${hn}' order by vn DESC limit 1) vn 
  from patient where hn = '${hn}' limit 1`
  r = await knex.raw(sql)
  if (!r[0][0]){
    res.json(data_none)
    return false
  }
  console.log(r[0][0])
  data = {
    'hn': r[0][0].hn,
    'cid': r[0][0].cid,
    'fullname': r[0][0].fullname,
    'sex':r[0][0].sex,
    'vn': r[0][0].vn
  }
  res.json(data)
});

router.get('/get_patient_by_vn/:vn', async function (req, res, next) {
  vn = req.params.vn
  sql = `SELECT t.hn,p.cid,concat(p.pname,p.fname,' ',p.lname) fullname,p.sex,t.vn 
  from ovst t INNER JOIN patient p ON t.hn = p.hn
  WHERE t.vn = '${vn}'`
  r = await knex.raw(sql)
  if (!r[0][0]){
    res.json(data_none)
    return false
  }
  console.log(r[0][0])
  data = {
    'hn': r[0][0].hn,
    'cid': r[0][0].cid,
    'fullname': r[0][0].fullname,
    'sex':r[0][0].sex,
    'vn': r[0][0].vn
  }
  res.json(data)
});

router.get('/get_today_visit_by_cid/:cid',function(req,res,next){

  data_not_found = {
    'visit_date':'2022-01-01',
    'visit_time':'12:00:00',
    'visit_number':'0'

  }
  res.json(data_not_found)

})

router.get('/get_today_visit_by_hn/:hn',function(req,res,next){

  data_not_found = {
    'visit_date':'2022-01-01',
    'visit_time':'12:00:00',
    'visit_number':'0'
  }
  res.json(data_not_found)

})

module.exports = router;
