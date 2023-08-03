var express = require('express');
var router = express.Router();
const axios = require('axios');
var config = require('../config.json')
token = "xxxxxxxx"

router.get('/send', async function (req, res, next) {

    device_data = {
        "bps": 120,
        "bps": 80,
        "pulse": 60,
        "temp": 37.5
    }
    body_data = {
        "cid":1111111111111,
        "vn":0,
        "device_data":device_data
    }
    n = await axios.post('https://www.ihealthrawae.net:8080/send', body_data, {
        headers: {
            'Authorization': `Basic ${token}`
        }
    })
    console.log(n)
    res.json({ 'n': "1" })
});




module.exports = router;
