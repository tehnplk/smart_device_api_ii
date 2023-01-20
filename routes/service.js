var express = require('express');
var router = express.Router();
var knex = require('../con_db')
var moment = require('moment')
var config = require('../config.json');
const { raw } = require('mysql');
const uuid = require('uuid');

router.post('/gen_queue', async (req, res) => {
    data = req.body
    today = moment().format('YYYY-MM-DD')
    q = await knex('smart_queue_pcu').where({ 'cid': data.cid, 'visit_date': today }).first()
    if (q) {
        res.status(200).json({
            "q": q.queue_number
        })
        return;
    }

    try {

        r = await knex.raw("select max(queue_number)  as q from smart_queue_pcu where visit_date = CURRENT_DATE")
        console.log('q', r[0][0].q)

        data['queue_number'] = r[0][0].q + 1
        r = await knex("smart_queue_pcu").insert(data)
        res.status(200).json({
            "q": data['queue_number']
        })

    } catch (error) {
        res.status(400).json({
            "q": NaN
        })

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
                'visit': 'exist',
                'vn': vn
            }
            await knex.raw('UNLOCK TABLES')
            res.json(resp);

            return false
        }

        sql = `
set @pid = ${pid};  
set @weight = (select t.weight from visit  t where t.pid = @pid and t.weight IS NOT NULL and t.visitdate < CURRENT_DATE order by t.visitno desc limit 1);
set @height = (select t.height from visit  t where t.pid = @pid and t.height IS NOT NULL and t.visitdate < CURRENT_DATE order by t.visitno desc limit 1);
set @pressure = (select t.pressure from visit  t where t.pid = @pid and t.pressure IS NOT NULL and t.visitdate < CURRENT_DATE order by t.visitno desc limit 1);
set @respri = (select t.respri from visit  t where t.pid = @pid and t.respri IS NOT NULL and t.visitdate < CURRENT_DATE order by t.visitno desc limit 1);
set @temperature = (select t.temperature from visit  t where t.pid = @pid and t.temperature IS NOT NULL and t.visitdate < CURRENT_DATE order by t.visitno desc limit 1);
set @waist = (select t.waist from visit  t where t.pid = @pid and t.waist IS NOT NULL and t.visitdate < CURRENT_DATE order by t.visitno desc limit 1);

SELECT @weight as weight ,@height as height ,@pressure as pressure,@respri as respri,@temperature as temperature,@waist as waist;
        `
        row = await knex.raw(sql)
        console.log(row[0])


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

        try {
            await knex('visit').insert(data_visit);
            res.status(200).json({ 'visit': 'success', 'vn': visitno });
        } catch (error) {
            console.debug(error)
            res.status(400).json({ 'visit': 'fail', 'vn': NaN });
        } finally {
            await knex.raw('UNLOCK TABLES')
        }


    } else {
        res.status(400).json({ 'visit': 'no patient', 'vn': NaN });
    }




});


router.post('/visit_hosxp', async (req, res, next) => {

    console.log('visit_hosxp', req.body)
    //res.status(200).json({ 'visit': 'test', 'vn': '0000'});
    //return;
    cid = req.body.cid;


    var CurrentDate = moment().format("YYYY-MM-DD");

    visit = await knex('vn_stat').where({ 'vstdate': CurrentDate, 'cid': cid }).first()
    if (visit) {

        console.log({ 'visit': 'exist', 'vn': visit.vn })
        res.status(200).json({
            'visit': 'exist',
            'vn': visit.vn
        });
        return;
    }





    patient = await knex('patient').where({ cid: cid }).first();

    if (!patient) {
        console.log({ 'visit': 'no patient', 'vn': NaN })
        res.status(200).json({
            'visit': 'no patient',
            'vn': NaN
        })
        return;
    }

    person = await knex('person').where({ cid: cid }).first();


    y = Number(moment().format("YYYY"));
    y = y + 543
    y = y.toString()
    y = y.slice(2)
    n = moment().format("MMDDHHmmss")
    vn = y + n;

    try {
        // hosxp_pcu

        sql = `  
                  set @doctor = '${config.hosxp.doctor}';
                  set @staff = '${config.hosxp.staff}';
                  set @dep = '${config.hosxp.dep}'; #ห้องตรวจ
                  set @spclty = '${config.hosxp.spclty}'; #แผนก
                  set @ovstlist = '01'; #มาเอง
                 

        
                  set @visit_date = (select CURRENT_DATE);
                  set @visit_time = (select CURRENT_TIME);
                  set @vn = '${vn}';
                  set @cid = '${cid}';
                  set @claim_type = '${req.body.claimtype}';
                  set @claim_code = (select if ('${req.body.claimcode}'='null','','${req.body.claimcode}'));
                  set @cc = @claim_code;
                  set @hn = '${patient.hn}';
                  set @sex = '${patient.sex}';
                  set @age_y = '11';
                  set @age_m = '10';
                  set @age_d = '9';
                  set @aid = '${patient.chwpart}${patient.amppart}${patient.tmbpart}'; # รหัสจังหวัด อำเภอ ตำบล
                  set @moopart = '${patient.moopart}'; # หมู่ที่
                  set @pttype = (select if('${patient.pttype}'='null','','${patient.pttype}'));
                  set @pttypeno = (select if('${patient.pttype_no}'='null','','${patient.pttype_no}'));
                  set @hospmain = (select if('${patient.pttype_hospmain}'='null','','${patient.pttype_hospmain}'));
                  set @hospsub = (select if('${patient.pttype_hospsub}'='null','','${patient.pttype_hospsub}'));
                  set @pcode =  (SELECT pcode from pttype WHERE pttype = @pttype);
                  set @hcode = (SELECT hospitalcode from opdconfig LIMIT 1); 
                  set @vstdate = @visit_date;
                  set @vsttime = @visit_time;
                  set @guid1 = (select upper('{${uuid.v4()}}'));
                  set @guid2 = (select upper('{${uuid.v4()}}'));
                  set @ovst_seq_id = (select get_serialnumber('ovst_seq_id'));
                  set @nhso_seq_id = @ovst_seq_id;
                  set @nhso_seq_id = CAST(@nhso_seq_id AS CHAR CHARACTER SET utf8);
                  set @ovst_q_today = concat('ovst-q-',LEFT(@vn,6));
                  set @ovst_q = (select get_serialnumber(@ovst_q_today));
                 
                  set @visit_type = ( SELECT   IF( (@visit_time  >= '16:30:00') OR (@visit_time <= '08:30:00') or (@visit_date in (SELECT holiday_date from holiday)),'O','I') );
                  set @lastvisit = 0;
                  set @pt_subtype = (select pt_subtype from pt_subtype where pcu is not null limit 1);
                  INSERT INTO vn_insert (vn) VALUES (@vn);
                  INSERT INTO vn_stat_signature (vn) VALUES (@vn);
                  INSERT INTO ovst (hos_guid,vn,hn,vstdate,vsttime,doctor,hospmain,hospsub,oqueue,ovstist,pttype,pttypeno,spclty,cur_dep,pt_subtype,visit_type,staff) 
                  VALUES (@guid1,@vn,@hn,@vstdate,@vsttime,@doctor,@hospmain,@hospsub,@ovst_q,@ovstlist,@pttype,@pttypeno,@spclty,@dep,@pt_subtype,@visit_type,@staff);
                  INSERT INTO ovst_seq (vn,seq_id,nhso_seq_id,update_datetime,promote_visit,last_check_datetime)
                  VALUES (@vn,@ovst_seq_id,@nhso_seq_id,NOW(),'N',NOW()); # complete
                  INSERT INTO vn_stat (vn,hn,pdx,lastvisit,dx_doctor,
                  dx0,dx1,dx2,dx3,dx4,dx5,sex,age_y,age_m,age_d,aid,moopart,pttype,spclty,vstdate
                  ,pcode,hcode,hospmain,hospsub,pttypeno,cid) 
                  VALUES (@vn,@hn,'',@lastvisit,@doctor,'','','','','','',@sex,@age_y,@age_m,@age_d,@aid,@moopart,@pttype
                  ,@spclty,@vstdate,@pcode,@hcode,@hospmain,@hospsub,@pttypeno,@cid);
                  set @bw = (select bw from opdscreen where hn = @hn and bw>0 and vn<@vn order by vn desc limit 1);
                  set @height = (select height from opdscreen where hn = @hn and height>0 and vn<@vn order by vn desc limit 1);
                  set @waist = (select waist from opdscreen where hn = @hn and waist>0 and vn<@vn order by vn desc limit 1);
                  set @bps = (select bps from opdscreen where hn = @hn  and vn<@vn order by vn desc limit 1);
                  set @bpd = (select bpd from opdscreen where hn = @hn  and vn<@vn order by vn desc limit 1);
                  set @pulse = (select pulse from opdscreen where hn = @hn and vn<@vn order by vn desc limit 1);
                  set @temperature = '37.0';
                  INSERT INTO opdscreen (hos_guid,vn,hn,vstdate,vsttime,bw,height,waist,bps,bpd,pulse,temperature,cc) 
                  VALUES (@guid2,@vn,@hn,@vstdate,@vsttime,@bw,@height,@waist,@bps,@bpd,@pulse,@temperature,@cc);
                  

                  set @icode :=  (SELECT IF(@visit_type = 'O' ,'${config.hosxp.icode_out_time}','${config.hosxp.icode_in_time}'));
                  set @price :=  (select price from nondrugitems where icode = @icode);

                  INSERT INTO opitemrece (hos_guid,vn,hn,icode,qty,unitprice,vstdate,vsttime,staff,item_no,last_modified,sum_price) 
                  VALUES (@guid2,@vn,@hn,@icode,1,@price,@vstdate,@vsttime,@staff,1,NOW(),@price);       
                  INSERT INTO dt_list (vn) VALUES (@vn);
                  UPDATE patient SET last_visit= @vstdate,mobile_phone_number = '{mobile}'  WHERE  cid = @cid;
                  INSERT INTO visit_pttype (vn, pttype, staff, hospmain, hospsub, pttypeno, update_datetime,pttype_note,claim_code,auth_code) 
                  VALUES (@vn, @pttype, @staff, @hospmain, @hospsub, @pttype_no , NOW(),@claim_type,@claim_code,@claim_code);
        
        `

        await knex.raw(sql)

        console.log({ 'visit': 'success', 'vn': vn })

        res.status(200).json({ 'visit': 'success', 'vn': vn });

    } catch (error) {
        console.dir(error)
        res.status(400).json({ 'visit': 'err', 'vn': NaN });
    }


})

router.get('/test', async (req, res, next) => {

    cid = '3650100810887'

    y = Number(moment().format("YYYY"));
    y = y + 543
    y = y.toString()
    y = y.slice(2)
    n = moment().format("MMDDHHmmss")

    gen_vn = y + n

    r = await knex.raw(`SELECT hn from patient WHERE cid = '${cid}' limit 1`)
    hn = r[0][0].hn

    r = await knex.raw(`select sex from patient WHERE cid = '${cid}' limit 1`)
    sex = r[0][0].sex

    r = await knex.raw(`SELECT TIMESTAMPDIFF( YEAR, t.birthday, NOW() ) age_y from patient t WHERE t.cid = '${cid}'`)
    age_y = r[0][0].age_y

    r = await knex.raw(`SELECT TIMESTAMPDIFF( MONTH,t.birthday, now() ) % 12 as 'age_m'from patient t WHERE t.cid = '${cid}'`)
    age_m = r[0][0].age_m

    r = await knex.raw(`SELECT FLOOR( TIMESTAMPDIFF( DAY, t.birthday, now() ) % 30.4375 ) age_d from patient t WHERE t.cid = '${cid}'`)
    age_d = r[0][0].age_d

    r = await knex.raw(`SELECT CONCAT(chwpart,amppart,tmbpart) aid from patient where cid = '${cid}'`)
    aid = r[0][0].aid


    console.log(aid)

    res.json({ 'n': 'ok' })


})

router.get('/del-vn-today', async (req, res, next) => {

    today = moment().format("YYYY-MM-DD")
    r = await knex('ovst').where({ 'vstdate': today }).select('vn')
    r.forEach(async (row) => {
        vn = row.vn

        u = await knex.raw(`
            set @vn = '${vn}';

            delete from vn_stat where vn = @vn;
            DELETE FROM ovst WHERE vn = @vn;
            DELETE FROM opdscreen WHERE vn = @vn;
            delete from incoth where vn = @vn;
            DELETE FROM opitemrece_summary WHERE vn = @vn;
            DELETE FROM opitemrece WHERE vn = @vn;
            DELETE from visit_pttype WHERE vn = @vn;
            DELETE from ovstdiag WHERE vn = @vn;
            `)
        console.dir(u)
    });
    res.json(r)



})

router.get('/del-vn-date/:d', async (req, res, next) => {
    const { d } = req.params
    console.log(d)
    today = d
    r = await knex('ovst').where({ 'vstdate': today }).select('vn')
    r.forEach(async (row) => {
        vn = row.vn

        u = await knex.raw(`
            set @vn = '${vn}';

            delete from vn_stat where vn = @vn;
            DELETE FROM ovst WHERE vn = @vn;
            DELETE FROM opdscreen WHERE vn = @vn;
            delete from incoth where vn = @vn;
            DELETE FROM opitemrece_summary WHERE vn = @vn;
            DELETE FROM opitemrece WHERE vn = @vn;
            DELETE from visit_pttype WHERE vn = @vn;
            DELETE from ovstdiag WHERE vn = @vn;
            `)
        console.dir(u)
    });
    res.json(r)



})






module.exports = router;
