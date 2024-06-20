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

router.post('/terminal', async (req, res) => {
    try {
        const {
            kiosk_no, hn, cid, fullname, age, priority_level,
            visit_date_time, inscl, claim_code, note,
            dep_start, dep_current, dep_current_in_time, dep_current_out_time,
            dep_current_out_type, queue_number
        } = req.body;

        const [id] = await db('x_queue_terminal').insert({
            kiosk_no, hn, cid, fullname, age, priority_level,
            visit_date_time, inscl, claim_code, note,
            dep_start, dep_current, dep_current_in_time, dep_current_out_time,
            dep_current_out_type, queue_number
        });

        res.status(200).json({ id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET endpoint to retrieve data from x_queue_terminal by queue_number and visit_date
router.get('/terminal', async (req, res) => {
    try {
        const { queue_number, visit_date } = req.query;
        const record = await db('x_queue_terminal')
            .where({ queue_number })
            .andWhereRaw('DATE(visit_date_time) = ?', [visit_date])
            .first();

        if (record) {
            res.status(200).json(record);
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
