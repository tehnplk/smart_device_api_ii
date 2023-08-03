var express = require('express');
var router = express.Router();
const axios = require('axios');

router.get('/send', async function (req, res, next) {
    var token = "2452cac74071f1d643f636358527354628cf2ca187121f36b43ff62b0ffda149f3938328d5ad5ae7d155e40df9ff4c5f9e224a51376e377a6d698c97aab84697"
    body_data = {
        "cid": "1111111111111",
        "vn": 999999999,
        "device_data": { bps: 139, bpd: 99, pulse: 66, temp: 37.9 }
    }
    n = await axios.post('https://ihealthrawae.net:8080/api/smart/send', body_data, {
        headers: {
            'Authorization': `${token}`
        }
    })
    console.log("response status", n.status)
    console.log(n.data)
    res.json({ 'status': body_data.device_data })
});

module.exports = router;
