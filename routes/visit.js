var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')

router.post('/open_visit_jhcis', async function (req, res, next) {
    data = req.body
    console.log('post data', data)
    cid = req.body.cid;
    claimtype = req.body.claimtype;
    claimcode = req.body.claimcode;
    vst_user = req.body.vst_user




    let person = await knex('person').where({ idcard: `${cid}` }).first()
    //console.log('person', JSON.stringify(person))

    let vn = await knex('visit').max('visitno', { as: 'vn' }).first()
    //console.log('vn', JSON.stringify(vn))

    if (person !== undefined) {
        visitno = vn.vn + 1;
        pcucodeperson = person.pcucodeperson;
        pid = person.pid;
        rightcode = person.rightcode;
        rightno = person.rightno;
        hosmain = person.hosmain;
        hossub = person.hossub;
        visitdate = moment().format('YYYY-MM-DD');
        timestart = moment().format('HH:mm:ss')
        dateupdate = moment().format('YYYY-MM-DD HH:mm:ss')

        let today_visit = await knex('visit')
            .where({ pid: pid, visitdate: visitdate })
            .whereNot({ flagservice: '99' })
            .orderBy('visitno', 'desc')
            .first()

        if (today_visit !== undefined) {
            vn = JSON.stringify(today_visit.visitno)
            //console.log(vn)

            u = await knex('visit').update({
                'hiciauthen_nhso': claimcode
            }).where('visitno', vn).whereNull('hiciauthen_nhso')

            resp = {
                'open_visit': 'today_visit_already',
                'vn': vn,
                'update_claimcode': JSON.stringify(u)
            }

            console.log(resp);
            res.json(resp);

            return false
        }


        data_visit = {
            'pcucode': config.hoscode,
            'visitno': visitno,
            'visitdate': visitdate,
            'pcucodeperson': pcucodeperson,
            'pid': pid,
            //'timeservice': '',
            'timestart': timestart,
            'rightcode': rightcode,
            'rightno': rightno,
            'hosmain': hosmain,
            'hossub': hossub,
            //'incup': '',
            'receivepatient': '00',
            'refer': '00',
            'money1': 0,
            'money2': 0,
            'money3': 0,
            'username': vst_user,
            'flagservice': '01',
            'dateupdate': dateupdate,
            'ipv4this': '0.0.0.0',
            'hiciauthen_nhso': claimcode

        }


        await knex('visit').insert(data_visit);
        resp = {
            'open_visit': 'success'
        }
        console.log(resp)
        res.json(resp)

    } else {
        resp = {
            'open_visit': 'not found person',
        }
        console.log(resp)
        res.json(resp)
    }




});




module.exports = router;
