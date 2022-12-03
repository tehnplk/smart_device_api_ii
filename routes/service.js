var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json')

router.post('/gen_queue', async (req, res) => {

    try {
        r = await knex.raw("select max(queue_number)  as q from smart_queue where visit_date = CURRENT_DATE")
        console.log('q', r[0][0].q)
        data = req.body
        data['queue_number'] = r[0][0].q + 1
        r = await knex("smart_queue").insert(data)
        res.status(200).json({
            "q": data['queue_number']
        })
    } catch (error) {
        res.status(400).json({
            "err": error
        })
        return;
    }


})


router.get('/check_patient/:cid', async (req, res, next) => {
    cid = req.params.cid;
    if (config.his == 'jhcis') {
        r = await knex('person').where({ 'cid': cid }).first()
        res.status(200).json(r)

    } else {
        r = await knex('patient').where({ 'cid': cid }).first()
        res.status(200).json(r)

    }


})

router.post('/visit_jhcis', async function (req, res, next) {
    data = req.body
    console.log('post data', data)
    cid = req.body.cid;
    rightcode = req.body.rightcode;
    rightno = req.body.rightno;
    claimtype = req.body.claimtype;
    claimcode = req.body.claimcode;
    vst_user = req.body.vst_user;




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
            vn = today_visit.visitno
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


router.post('/visit_hosxp', async (req, res, next) => {

    cid = req.body.cid;
    console.log(cid)
    rightcode = req.body.rightcode;
    rightno = req.body.rightno;
    claimtype = req.body.claimtype;
    claimcode = req.body.claimcode;

    //res.json(req.body)

    try {

        r = await knex.raw(`

        SET AUTOCOMMIT=0;
set @cid = '${cid}';
set @hn = (SELECT hn from patient WHERE cid = @cid);
set @vn = (SELECT  concat(RIGHT(YEAR(CURRENT_DATE)+543,2) , MONTH(CURRENT_DATE) , DAY(CURRENT_DATE) ,TIME_FORMAT(TIME(NOW()),'%H%i%s')));
set @vstdate = CURRENT_DATE;
set @vsttime = CURRENT_TIME;
set @guid1 = (select concat('{',UPPER(UUID()),'}'));
set @guid2 = (select concat('{',UPPER(UUID()),'}'));
set @ovst_seq_id = (select get_serialnumber('ovst_seq_id'));
set @ovst_q_today := concat('ovst-q-',LEFT(@vn,6));
set @ovst_q := (select get_serialnumber(@ovst_q_today));
set @doctor := '001';
set @staff := @doctor;
set @pttype := (select pttype from patient where cid = @cid);
set @pttypeno := (select pttype_no from patient where cid = @cid);
set @hospmain := (select pttype_hospmain from patient where cid = @cid);
set @hospsub := (select pttype_hospsub from patient where cid = @cid);
set @dep := '019';
set @spclty := '01';
set @ovstlist := '01';
set @visit_type := ( SELECT   IF( (CURRENT_TIME  >= '16:30:00') OR (CURRENT_TIME <= '08:30:00') or (CURRENT_DATE in (SELECT holiday_date from holiday)),'O','I') );


INSERT INTO vn_insert (vn) VALUES (@vn);
INSERT INTO vn_stat_signature (vn) VALUES (@vn);


INSERT INTO ovst (hos_guid,vn,hn,vstdate,vsttime,doctor,hospmain,hospsub,oqueue,ovstist,pttype,pttypeno,spclty,cur_dep,pt_subtype,visit_type,staff) 
VALUES (@guid1,@vn,@hn,@vstdate,@vsttime,@doctor,@hospmain,@hospsub,@ovst_q,@ovstlist,@pttype,@pttypeno,@spclty,@dep,0,@visit_type,@staff);


INSERT INTO ovst_seq (vn,seq_id,nhso_seq_id,update_datetime,promote_visit,last_check_datetime)
VALUES (@vn,@ovst_seq_id,0,NOW(),'N',NOW()); # complete

INSERT INTO vn_stat (vn,hn,pdx,lastvisit,dx_doctor,
dx0,dx1,dx2,dx3,dx4,dx5,sex,age_y,age_m,age_d,aid,moopart,
count_in_month,count_in_year,pttype,income,paid_money,remain_money,
uc_money,item_money,spclty,vstdate,op0,op1,op2,op3,op4,op5,pttype_in_region,pttype_in_chwpart,
pcode,hcode,inc01,inc02,inc03,inc04,inc05,inc06,inc07,inc08,inc09,inc10,inc11,inc12,inc13,inc14,inc15,inc16,
hospmain,hospsub,pttypeno,cid,main_pdx,inc17,inc_drug,inc_nondrug,pt_subtype,rcpno_list,ym,ill_visit,count_in_day,
lastvisit_hour,rcpt_money,discount_money,old_diagnosis,debt_id_list) 
VALUES (@vn,@hn,'',1201,@doctor,'','','','','','','2',41,3,3,'650106','08',0,0,'02',50,0,0,50,50,'01',
CURRENT_DATE,'','','','','','','Y','Y','A7','07480',0,0,0,0,0,0,0,0,0,0,0,50,0,0,0,0,@hospmain,@hospsub,
@pttypeno,@cid,'',0,0,0,0,'\"\"','2022-11','Y',0,28847,0,0,'Y','');


set @bw = (select bw from opdscreen where hn = @hn and bw>0 and vn<@vn order by vn desc limit 1);
set @height = (select height from opdscreen where hn = @hn and height>0 and vn<@vn order by vn desc limit 1);
set @waist = (select waist from opdscreen where hn = @hn and waist>0 and vn<@vn order by vn desc limit 1);
INSERT INTO opdscreen (hos_guid,vn,hn,vstdate,vsttime ,bw ,height,waist) VALUES (@guid2,@vn,@hn,@vstdate,@vsttime,@bw,@height,@waist);

set @cliam_type = 'PG0060001';
set @cliam_code = 'PP123456';

INSERT INTO visit_pttype (vn, pttype, staff, hospmain, hospsub, pttypeno, update_datetime,pttype_note,auth_code) 
VALUES (@vn, @pttype, @staff, @hospmain, @hospsub, @pttype_no , NOW(),@claim_type,@claim_code);


set @icode :=  (SELECT IF(@visit_type = 'O' ,'3000002','3000001'));
set @price := 50;
INSERT INTO opitemrece (hos_guid,vn,hn,icode,qty,unitprice,vstdate,vsttime,
staff,item_no,last_modified,sum_price) 
VALUES (@guid2,@vn,@hn,@icode,1,@price,@vstdate,@vsttime,
@staff,1,NOW(),@price);



INSERT INTO dt_list (vn) VALUES (@vn);

UPDATE patient SET last_visit= CURRENT_DATE WHERE  hn = @hn;
COMMIT;
     


`);
        //console.dir(JSON.stringify(r))
        res.status(200).json({ 'add': 'ok' });

    } catch (error) {
        res.status(400).json({ 'err': error });
    }




})




module.exports = router;
