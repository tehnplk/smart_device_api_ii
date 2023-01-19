var express = require('express');
var router = express.Router();
var knex = require('../con_db');
var moment = require('moment')
var config = require('../config.json')


router.post('/post_data_bp', async function (req, res, next) {
    data = req.body
    var _now = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log(_now + 'post_data_bp')
    console.log(data)
    if (config.his == 'hosxp') {
        r = await knex('opdscreen')
            .where('vn', '=', data.vn)
            .update({
                //temperature: data.data.tp,
                bps: data.data.bps,
                bpd: data.data.bpd,
                pulse: data.data.pulse
            })
        res.json(r)
    }

    if (config.his == 'jhcis') {
        r = await knex('visit')
            .where('visitno', '=', data.vn)
            .update({
                //temperature: data.data.tp,
                pressure: data.data.bps + '/' + data.data.bpd,
                pulse: data.data.pulse
            })
        res.json(r)
    }

    if (config.his == 'him') {

        console.log('Him',req.body);
		raw = req.body

        let vn = raw.vn;
        let hpressure = raw.data.bps;
        let lpressure = raw.data.bpd;
        let pulse = raw.data.pulse;

        console.log('POST BP DATA = ', vn, hpressure, lpressure, pulse);
		
		if(!vn){
			res.json({'vn':''})
			return false;
		}

        let p = vn.split('|');
        if (p.length != 3) {
            console.log('No hn.')
            res.json({
                'effect': 0
            })
            return false;
        }
        let hn = p[0];
        let regdate = p[1];
        let frequency = p[2];

        r = await knex('opd')
            .where({
                'hn': hn,
                'regdate': regdate,
                'frequency': frequency
            })
            .update({
                hpressure: hpressure,
                lpressure: lpressure,
                pulse: pulse
            })
        res.json(r)
    }




});

router.post('/post_data_bp_list', async function (req, res, next) {
    data = req.body
    console.log(data)
    let vn = data.vn;
    let temperature = data.data.tp;
    let bps = data.data.bps;
    let bpd = data.data.bpd;
    let pulse = data.data.pulse;
    let depcode = data.data.dep;
    let staff = data.data.staff;

    if (data.vn == null) {
        console.log('vn is null')
        res.json({
            'opdscreen_bp vn is null': 'null'
        });
        return false;
    }
    if (config.his != 'hosxp') {
        console.log('not hosxp')
        res.json({
            'his': 'not hosxp'
        });
        return false;
    }

    //for mysql
    let sql = ` replace into opdscreen_bp 
  set opdscreen_bp_id = get_serialnumber('opdscreen_bp_id') 
  ,vn ='${vn}' ,bps=${bps} ,bpd=${bpd} ,pulse=${pulse} ,depcode='${depcode}' ,staff='${staff}' 
  ,screen_date = CURRENT_DATE,screen_time = CURRENT_TIME ,rr=0,o2sat=0,temperature= ${temperature} `;

    // for postgres
    if (config.db.client == 'pg') {
        let sql = `insert into opdscreen_bp (opdscreen_bp_id,vn,bps,bpd,pulse,depcode,staff,screen_date,screen_time,temperature) 
    values (get_serialnumber('opdscreen_bp_id'),'${vn}',${bps},${bpd},${pulse},'${depcode}','${staff}',CURRENT_DATE,CURRENT_TIME(0),${temperature}) 
    ON CONFLICT (opdscreen_bp_id) DO UPDATE 
    SET vn=excluded.vn,bps=excluded.bps,bpd=excluded.bpd,pulse=excluded.pulse,
  depcode=excluded.depcode,staff=excluded.staff,screen_date=excluded.screen_date,screen_time=excluded.screen_time,temperature=excluded.temperature`
    }
    console.log('client', config.db.client)
    console.log(sql)

    try {
        let data = await knex.raw(sql);
        res.json({
            'opdscreen_bp': 'added'
        });
    } catch (error) {
        res.json({
            'opdscreen_bp': error
        });
    }


});

router.post('/post_data_bp_log', async function (req, res, next) {
    data = req.body
    console.log(data)
    raw = {
        'vn': data.vn,
        'cid': data.cid,
        'hn': data.hn,
        'fullname': data.fullname,
        'note1': data.data.dep,
        'note2': data.data.staff,
        'note3': data.data.machine,
        'd_update': moment().format('YYYY-MM-DD HH:mm:ss'),
        'tp': data.data.tp,
        'bps': data.data.bps,
        'bpd': data.data.bpd,
        'pulse': data.data.pulse
    };
    r = await knex('smart_gate_bp').insert(raw)
    res.json(r)

});


module.exports = router;
