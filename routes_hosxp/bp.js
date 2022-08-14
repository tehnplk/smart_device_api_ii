var express = require('express');
var router = express.Router();
var knex = require('../con_db')


router.post('/post_data_bp', async function (req, res, next) {
    data = req.body
    console.log(data)
    r = await knex('opdscreen')
        .where('vn', '=', data.vn)
        .update({
            bps: data.data.bps,
            bpd: data.data.bpd,
            pulse: data.data.pulse
        })
    res.json(data)

});

router.post('/post_data_bp_list', async function (req, res, next) {

    let vn = req.body.vn;
    let bps = req.body.bps;
    let bpd = req.body.bpd;
    let pulse = req.body.pulse;
    let depcode = req.body.depcode;
    let staff = req.body.staff;
    let sql = ` replace into opdscreen_bp 
  set opdscreen_bp_id = get_serialnumber('opdscreen_bp_id') 
  ,vn =? ,bps=? ,bpd=? ,pulse=? ,depcode=? ,staff=? 
  ,screen_date = CURRENT_DATE,screen_time = CURRENT_TIME ,rr=0,o2sat=0,temperature=0 `;
    try {
        let data = await knex.raw(sql, [vn, bps, bpd, pulse, depcode, staff]);
        res.json({
            'opdscreen_bp': 'added'
        });
    } catch (error) {
        res.json({
            'opdscreen_bp': 'error'
        });
    }


});

router.post('/post_data_bp_log', async function (req, res, next) {
    data = req.body
    console.log(data)
    res.json(data)

});


module.exports = router;
