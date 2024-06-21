var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json');
const { raw } = require('mysql');
const uuid = require('uuid');

router.get('/', (req, res) => {
    res.status(200).json({'successs':'ok'});
})

router.get('/queue',async(req,res)=>{
    today = moment().format('YYYY-MM-DD')
    console.log(req.body)
    try {
        const {cid} = req.body;
        const result = await knex('x_queue_terminal')
          .where({ 'cid': cid, 'visit_date': today })
          .first();
    
        if (result) {
          res.status(200).json({ queue_num: result.queue_num ,queue_dep:result.queue_dep });
        } else {
          res.status(404).json({ message: 'No records found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }



});

module.exports = router;
