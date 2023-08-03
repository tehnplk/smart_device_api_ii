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

module.exports = router;
