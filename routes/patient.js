var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var config = require('../config.json')

data_none = {
  'hn': NaN,
  'cid': NaN,
  'fullname': NaN,
  'sex': NaN,
  'vn': NaN
}
router.get('/test', async function (req, res, next) {
  sql = "select vn , hn , vstdate,vsttime from ovst order by vn DESC limit 1"
  if (config.his == 'jhcis') {
    sql = "select visitno as vn ,pid as hn , visitdate as vstdate,timestart as vsttime from visit order by visitno DESC limit 1"
  }

  r = await knex.raw(sql)

  if (config.db.client == 'pg') {
    r[0] = r.rows;
  }

  data = {
    'test': 'SUCCESS',
    'hn': r[0][0].hn,
    'vn': r[0][0].vn,
    'vstdate': r[0][0].vstdate,
    'vsttime': r[0][0].vsttime
  }
  console.log(data)
  res.json(data)

})

router.get('/get_patient_by_cid/:cid', async function (req, res, next) {
  cid = req.params.cid
  sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,sex
  ,(select vn from vn_stat where vstdate = CURRENT_DATE  and cid = '${cid}' order by vn DESC limit 1) vn 
  from patient where cid = '${cid}' limit 1`

  if (config.his == 'jhcis') {
    sql = `select p.pid as hn,idcard as cid,concat(c.titlename,p.fname,' ',p.lname) as fullname,p.sex as sex
    , (select visitno from visit v inner join person p on v.pid = p.pid where v.visitdate = CURRENT_DATE and p.idcard = '${cid}' order by v.visitno DESC limit 1 ) as vn
    from person p  left join ctitle c on c.titlecode = p.prename
    where p.idcard = '${cid}' limit 1`
  }

  r = await knex.raw(sql)

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
    'vn': r[0][0].vn
  }
  res.json(data)
});

router.get('/get_patient_by_hn/:hn', async function (req, res, next) {
  hn = req.params.hn
  sql = `select hn,cid,concat(pname,fname,' ',lname) fullname,sex
  ,(select vn from vn_stat where vstdate = CURRENT_DATE  and hn = '${hn}' order by vn DESC limit 1) vn 
  from patient where hn = '${hn}' limit 1`

  if (config.his == 'jhcis') {
    sql = `select p.pid as hn,idcard as cid,concat(c.titlename,p.fname,' ',p.lname) as fullname,p.sex as sex
    , (select visitno from visit v  where v.visitdate = CURRENT_DATE and v.pid = '${hn}' order by v.visitno DESC limit 1 ) as vn
    from person p  left join ctitle c on c.titlecode = p.prename
    where p.pid = '${hn}' limit 1`
  }

  r = await knex.raw(sql)

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
    'vn': r[0][0].vn
  }
  res.json(data)
});

router.get('/get_patient_by_vn/:vn', async function (req, res, next) {
  vn = req.params.vn
  sql = `SELECT t.hn,p.cid,concat(p.pname,p.fname,' ',p.lname) fullname,p.sex,t.vn 
  from ovst t INNER JOIN patient p ON t.hn = p.hn
  WHERE t.vn = '${vn}'`

  if (config.his == 'jhcis') {
    sql = `select v.pid as hn,p.idcard as cid,concat(c.titlename,p.fname,' ',p.lname) as fullname
    ,p.sex , v.visitno as vn  from visit v 
    left join person p on v.pid = p.pid 
    left join ctitle c on c.titlecode = p.prename
    where v.visitno = '${vn}'`
  }

  r = await knex.raw(sql)

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
    'vn': r[0][0].vn
  }
  res.json(data)
});

router.get('/get_today_visit_by_cid/:cid', async function (req, res, next) {
  cid = req.params.cid
  sql = `SELECT t.vstdate visit_date, t.vsttime visit_time, t.vn visit_number from  ovst t 
  INNER JOIN patient p on p.hn = t.hn
  WHERE t.vstdate = CURRENT_DATE and p.cid = '${cid}' ORDER BY t.vn DESC limit 1`

  if (config.his == 'jhcis') {
    sql = `select v.visitdate visit_date,v.timestart visit_time,v.visitno visit_number from visit v
    inner join person p on p.pid = v.pid 
    WHERE v.visitdate = CURRENT_DATE and p.idcard = '${cid}' ORDER BY v.visitno DESC limit 1
    `
  }

  r = await knex.raw(sql)

  if (config.db.client == 'pg') {
    r[0] = r.rows;
  }

  console.dir(r[0])
  if (!r[0][0]) {
    data_none = {
      'visit_number': NaN,
      'visit_date': NaN,
      'visit_time': NaN
    }
    res.json(data_none)
    return false
  }
  data = {
    'visit_number': r[0][0].visit_number,
    'visit_date': r[0][0].visit_date,
    'visit_time': r[0][0].visit_time
  }
  res.json(data)

})

router.get('/get_today_visit_by_hn/:hn', async function (req, res, next) {
  hn = req.params.hn
  sql = `SELECT t.vstdate , t.vsttime, t.vn from  ovst t WHERE t.vstdate = CURRENT_DATE and t.hn = '${hn}' ORDER BY t.vn DESC limit 1`

  if (config.his == 'jhcis') {
    sql = `select v.visitdate visit_date,v.timestart visit_time,v.visitno visit_number from visit v
    WHERE v.visitdate = CURRENT_DATE and v.pid = '${hn}' ORDER BY v.visitno DESC limit 1
    `
  }

  r = await knex.raw(sql)




  if (config.db.client == 'pg') {
    r[0] = r.rows;
  }

  if (!r[0][0]) {
    data_none = {
      'visit_number': NaN,
      'visit_date': NaN,
      'visit_time': NaN
    }
    res.json(data_none)
    return false
  }
  data = {
    'visit_number': r[0][0].visit_number,
    'visit_date': r[0][0].visit_date,
    'visit_time': r[0][0].visit_time
  }
  res.json(data)
})

module.exports = router;
