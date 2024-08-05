var express = require('express');
var router = express.Router();
const axios = require('axios');
var config = require('../config.json')


router.get('/', async function (req, res, next) {
    const {hospcode,vn,computer_name,app_name} = req.query
    url = `https://cloud4.hosxp.net/api/ovst_key`
    try {
        response = await axios.get(`${url}`,{
            params:{
                "Action": "get_ovst_key",
                "hospcode": hospcode,
                "vn": vn,
                "computer_name": computer_name,
                "app_name": app_name
              }
        })
        r = response.data
        console.log()
        res.json(r)
    } catch (error) {
        res.send(error)
    }

});



module.exports = router;
