var express = require('express');
var router = express.Router();
var db = require('../con_db')
var moment = require('moment')
var config = require('../config.json');
const { raw } = require('mysql');
const uuid = require('uuid');

router.get('/test', (req, res) => {
  res.status(200).json({ 'successs': 'ok' });
})

router.get('/patient/:cid', async (req, res) => {
  let cid = req.params.cid
  let sql = `
select p.pid as hn,idcard as cid,concat(c.titlename,p.fname,' ',p.lname) as fullname,p.sex as sex,birth 
,concat('(',p.rightcode,')',' ',rc.rightname) as inscl
,concat(a.hno,' หมู่ที่',a.mu, ' ตำบล',tmb.subdistname, ' อำเภอ',amp.distname,  ' จังหวัด',chw.provname) addr
from person p  
left join ctitle c on c.titlecode = p.prename
LEFT JOIN cright rc on rc.rightcode = p.rightcode
LEFT JOIN personaddresscontact a on a.pid = p.pid
LEFT JOIN csubdistrict tmb on CONCAT(tmb.provcode,tmb.distcode,tmb.subdistcode) = CONCAT(a.provcode,a.distcode,a.subdistcode)
LEFT JOIN cdistrict amp on CONCAT(amp.provcode,amp.distcode) = CONCAT(a.provcode,a.distcode)
LEFT JOIN cprovince chw on CONCAT(chw.provcode) = CONCAT(a.provcode)
where p.idcard =  '${cid}'  limit 1
`;
  console.log(sql)

  try {
    r = await db.raw(sql)
  } catch (error) {
    res.json(error)
    return false
  }


  if (!r[0][0]) {
    let data_none = {
      'hn': NaN,
      'cid': cid,
      'fullname': 'ไม่พบข้อมูลบุคคล',
      'sex': NaN,
      'vn': NaN,
      'birth': NaN,
      'addr': NaN,
      'inscl': NaN
    }
    console.log(data_none)
    res.json(data_none)
    return false
  }
  console.log(r[0][0])
  data = {
    'hn': r[0][0].hn,
    'cid': r[0][0].cid,
    'fullname': r[0][0].fullname,
    'sex': r[0][0].sex,
    'vn': r[0][0].vn,
    'birth': r[0][0].birth,
    'addr': r[0][0].addr,
    'inscl': r[0][0].inscl
  }
  res.json(data)


});

// Get all records
router.get('/', async (req, res) => {
  try {
    const data = await db('x_queue_terminal').select('*');
    resstatus(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single record by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await db('x_queue_terminal').where('id', req.params.id).first();
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/dep/:dep', async (req, res) => {
  today = moment().format('YYYY-MM-DD')
  const { dep } = req.params
  try {
    const data = await db('x_queue_terminal').where({ 'dep_start': dep, 'visit_date': today }).orderBy('id', 'desc').first();
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new record
router.post('/', async (req, res) => {
  let today = moment().format('YYYY-MM-DD')
  let now = moment().format('YYYY-MM-DD HH:mm:ss')
  let data = req.body
  const { cid ,claim_code} = req.body
  if (cid) {    
    let row = await db('x_queue_terminal').where({ cid: cid, visit_date: today }).orderBy('id', 'desc').first()
    console.log(row)
    if (row) {
      row['claim_code'] = claim_code
      await db('x_queue_terminal').where({ cid: cid, visit_date: today }).update(row)
      res.status(202).json(row);
      return;
    }
  }

  try {
    const count = await db('x_queue_terminal').count('* as count').whereRaw('DATE(visit_date) = CURDATE()');
    let q = count[0].count + 1
    data['queue_all_of_day'] = q
    data['dep_current_begin_at'] = now

    const [id] = await db('x_queue_terminal').insert(data);

    res.status(201).json({ id: id, queue_all_of_day: q });
  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: err.message });
  }
});

// Update a record by ID
router.put('/:id', async (req, res) => {
  try {
    const rowsAffected = await db('x_queue_terminal').where('id', req.params.id).update(req.body);
    if (rowsAffected) {
      res.json({ message: 'Record updated' });
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a record by ID
router.delete('/:id', async (req, res) => {
  try {
    const rowsAffected = await db('x_queue_terminal').where('id', req.params.id).del();
    if (rowsAffected) {
      res.json({ message: 'Record deleted' });
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
