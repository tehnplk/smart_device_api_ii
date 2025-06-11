var express = require('express');
var router = express.Router();
const axios = require('axios');
var config = require('../config.json')

router.get('/send', async function (req, res, next) {
     body_data = {
        "cid": "1111111111111",
        "vn": 999999999,
        "device_data": { bps: 139, bpd: 99, pulse: 66, temp: 37.9 }
    }
    n = await axios.post(config.ihealth_api, body_data, {
        headers: {
            'Authorization': `${config.ihealth_token}`
        }
    })
    console.log("response status", n.status)
    console.log(n.data)
    res.json({ 'status': body_data.device_data })
});

router.post('/post',function (req,res){
    console.log(req.body)
    res.json(req.body)
})

router.get('/get',function (req,res){
    console.log({'call':'1'})
    res.json({'done':1})
})

router.get('/pg',function (req,res){
 let sql_ = `insert into opdscreen_bp (opdscreen_bp_id,vn,bps,bpd,pulse,depcode,staff,screen_date,screen_time,temperature)
    values (get_serialnumber('opdscreen_bp_id'),'${vn}',${bps},${bpd},${pulse},'${depcode}','${staff}',CURRENT_DATE,CURRENT_TIME(0),${temperature})
    ON CONFLICT (opdscreen_bp_id) DO UPDATE
    SET vn=excluded.vn,bps=excluded.bps,bpd=excluded.bpd,pulse=excluded.pulse,
  depcode=excluded.depcode,staff=excluded.staff,screen_date=excluded.screen_date,screen_time=excluded.screen_time,temperature=excluded.temperature`;


 let sql = `insert into opdscreen_bp (opdscreen_bp_id,vn,bps,bpd,pulse,depcode,staff,screen_date,screen_time,temperature)
    values (get_serialnumber('opdscreen_bp_id'),'0',120,80,66,'001','admin',CURRENT_DATE,CURRENT_TIME(0),37.0)
    ON CONFLICT (opdscreen_bp_id) DO UPDATE
    SET vn=excluded.vn,bps=excluded.bps,bpd=excluded.bpd,pulse=excluded.pulse,
  depcode=excluded.depcode,staff=excluded.staff,screen_date=excluded.screen_date,screen_time=excluded.screen_time,temperature=excluded.temperature`;

  let response = knex.raw(sql)
}

)
module.exports = router;
