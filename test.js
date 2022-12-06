const { json } = require('express')
var moment = require('moment')

var knex = require('./con_db')

async function test() {
    sql = `select * from ovst t left join patient c on t.hn=c.hn where c.cid = '3650100810887' limit 1`
    r = await knex.raw(sql);
    console.dir(r[0][0])
}

test();