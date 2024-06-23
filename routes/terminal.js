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
  try {
    data = req.body
    console.log('q',data)
    const count = await db('x_queue_terminal').count('* as count').whereRaw('DATE(visit_date) = CURDATE()');
    let q = count[0].count+1
    data['queue_all_of_day'] = q

    const [id] = await db('x_queue_terminal').insert(data);
    
    res.status(201).json({ id:id ,queue_all_of_day:q});
  } catch (err) {
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
