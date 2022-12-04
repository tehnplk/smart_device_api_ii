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

    patient = await knex('patient').where({ cid: cid }).first();

    gen_vn = await knex.raw(`
    
    set @yy = RIGHT(YEAR(CURRENT_DATE)+543,2);
    set @mm = LPAD(MONTH(CURRENT_DATE),2,0);
    set @dd = LPAD(DAY(CURRENT_DATE),2,0);
    set @tt = TIME_FORMAT(TIME(NOW()),'%H%i%s');
    select concat( @yy, @mm , @dd  , @tt) as 'vn';

`   );
    vn = gen_vn[0][4][0].vn;

    if(!patient){
        res.status(200).json({
            'patient':NaN,
            'vn':vn
        })
        return;
    }

    try {

        r = await knex.raw(`


        SET AUTOCOMMIT=0;
        set @cid = '${cid}';
        set @hn = (SELECT hn from patient WHERE cid = @cid);
        set @sex = (select sex from patient WHERE cid = @cid);
        set @age_y = (SELECT TIMESTAMPDIFF( YEAR, t.birthday, NOW() ) from patient t WHERE t.cid = @cid );
        set @age_m = (SELECT TIMESTAMPDIFF( MONTH,t.birthday, now() ) % 12 from patient t WHERE t.cid = @cid );
        set @age_d = (SELECT FLOOR( TIMESTAMPDIFF( DAY, t.birthday, now() ) % 30.4375 ) from patient t WHERE t.cid = @cid );
        set @aid = (SELECT CONCAT(chwpart,amppart,tmbpart) from patient where cid = @cid); # รหัสจังหวัด อำเภอ ตำบล
        set @moopart = (SELECT moopart from patient where cid = @cid); # หมู่ที่
        
        
        set @pttype = (select pttype from patient where cid = @cid);
        set @pttypeno = (select pttype_no from patient where cid = @cid);
        set @hospmain = (select pttype_hospmain from patient where cid = @cid);
        set @hospsub = (select pttype_hospsub from patient where cid = @cid);
        set @pcode = (SELECT pttype.pcode FROM person INNER JOIN pttype ON person.pttype = pttype.pttype where person.cid=@cid);
        set @hcode = (SELECT hospitalcode FROM opdconfig LIMIT 1); 
        
        
        
        
        set @vn =  ${vn};
        set @vstdate = CURRENT_DATE;
        set @vsttime = CURRENT_TIME;
        set @guid1 = (select concat('{',UPPER(UUID()),'}'));
        set @guid2 = (select concat('{',UPPER(UUID()),'}'));
        set @ovst_seq_id = (select get_serialnumber('ovst_seq_id'));
        set @nhso_seq_id = @ovst_seq_id;
        set @ovst_q_today = concat('ovst-q-',LEFT(@vn,6));
        set @ovst_q = (select get_serialnumber(@ovst_q_today));
        
        set @doctor = '001';
        set @staff = @doctor;
        set @dep = '019'; #ห้องตรวจ
        set @spclty = '01'; #แผนก
        set @ovstlist = '01'; #มาเอง
        set @visit_type = ( SELECT   IF( (CURRENT_TIME  >= '16:30:00') OR (CURRENT_TIME <= '08:30:00') or (CURRENT_DATE in (SELECT holiday_date from holiday)),'O','I') );
        set @lastvisit = 0;
        
        INSERT INTO vn_insert (vn) VALUES (@vn);
        INSERT INTO vn_stat_signature (vn) VALUES (@vn);
        
        
        INSERT INTO ovst (hos_guid,vn,hn,vstdate,vsttime,doctor,hospmain,hospsub,oqueue,ovstist,pttype,pttypeno,spclty,cur_dep,pt_subtype,visit_type,staff) 
        VALUES (@guid1,@vn,@hn,@vstdate,@vsttime,@doctor,@hospmain,@hospsub,@ovst_q,@ovstlist,@pttype,@pttypeno,@spclty,@dep,0,@visit_type,@staff);
        
        
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
        res.status(200).json({ 'add': 'ok','vn':vn });

    } catch (error) {
        res.status(400).json({ 'err': error });
    }




})




module.exports = router;