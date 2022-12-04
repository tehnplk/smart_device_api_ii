const { json } = require('express')
var moment = require('moment')

var knex = require('./con_db')

sql = `select hn from patient where cid = '3650100810887' limit 1`
knex.raw(sql).then((data)=>{
    console.dir(data[0][0].hn)
})