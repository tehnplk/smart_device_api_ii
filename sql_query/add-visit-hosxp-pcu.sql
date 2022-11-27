set @hn := '000000040';
set @cid := (SELECT cid from patient WHERE hn = @hn);
set @vn = (SELECT  concat(RIGHT(YEAR(CURRENT_DATE)+543,2) , MONTH(CURRENT_DATE) , DAY(CURRENT_DATE) ,TIME_FORMAT(TIME(NOW()),'%H%i%s')));
set @guid1 = (select concat('{',UPPER(UUID()),'}'));
set @guid2 = (select concat('{',UPPER(UUID()),'}'));
set @ovst_seq_id = (select get_serialnumber('ovst_seq_id'));
set @ovst_q_today := concat('ovst-q-',LEFT(@vn,6));
set @ovst_q = (select get_serialnumber(@ovst_q_today));

INSERT INTO ovst (hos_guid,vn,hn,an,vstdate,vsttime,doctor,hospmain,hospsub,oqueue,ovstist,ovstost,pttype
,pttypeno,rfrics,rfrilct,rfrocs,rfrolct,spclty,rcpt_disease,hcode,cur_dep,cur_dep_busy,last_dep
,cur_dep_time,rx_queue,diag_text,pt_subtype,main_dep,main_dep_queue,finance_summary_date
,visit_type,node_id,contract_id,waiting,rfri_icd10,o_refer_number,has_insurance
,i_refer_number,refer_type,o_refer_dep,staff,command_doctor,send_person,pt_priority,finance_lock
,oldcode,sign_doctor,anonymous_visit,anonymous_vn,pt_capability_type_id,at_hospital,ovst_key,pcu_code,pcu_vn) 
VALUES (@guid1,@vn,@hn,NULL,DATE(NOW()),TIME(NOW()),'001','10676','07480',@ovst_q,'01'
,NULL,'02',@cid,NULL,NULL,NULL,NULL,'01',NULL,NULL,'014',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'O'
,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'001',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);


INSERT INTO ovst_seq (vn,seq_id,pttype_check,pttype_check_datetime,pttype_check_staff,pcu_person_id,last_opdcard_depcode
,protect_sensitive_data,rx_queue_no,stock_department_id,stock_department_queue_no,last_stock_department_id,nhso_seq_id
,update_datetime,promote_visit,hos_guid,service_cost,last_rx_operator_staff,last_check_datetime,pttype_check_status_id
,hospital_department_id,register_depcode,register_computer,doctor_list_text,er_pt_type,er_emergency_type,sub_spclty_id
,doctor_patient_type_id,finance_status_flag,has_arrear,rx_ok,has_scan_doc,rx_queue_list,rx_queue_time,dx_text_list,opd_qs_slot_id
,rx_transaction_id,doctor_dx_list_text,doctor_rx_list_text,pttype_list_text,hospmain_list_text,edc_approve_list_text,rx_priority_id
,ovst_doctor_list_text) 
VALUES (@vn,@ovst_seq_id,NULL,NULL,NULL,'001040',NULL,NULL,NULL,NULL,NULL,NULL,0,NOW(),'N'
,NULL,NULL,NULL,NOW(),NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL
,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);


INSERT INTO vn_stat (vn,hn,pdx,gr504,lastvisit,accident_code,dx_doctor,dx0,dx1,dx2,dx3,dx4,dx5,sex,age_y
,age_m,age_d,aid,moopart,count_in_month,count_in_year,pttype,income,paid_money,remain_money,uc_money
,item_money,dba,spclty,vstdate,op0,op1,op2,op3,op4,op5,rcp_no,print_count,print_done,pttype_in_region
,pttype_in_chwpart,pcode,hcode,inc01,inc02,inc03,inc04,inc05,inc06,inc07,inc08,inc09,inc10,inc11,inc12
,inc13,inc14,inc15,inc16,hospmain,hospsub,pttypeno,pttype_expire,cid,main_pdx,inc17,inc_drug,inc_nondrug
,pt_subtype,rcpno_list,ym,node_id,ill_visit,count_in_day,pttype_begin,lastvisit_hour,rcpt_money,discount_money
,old_diagnosis,debt_id_list,vn_guid,lastvisit_vn,hos_guid,rx_license_no,lab_paid_ok,xray_paid_ok) 
VALUES (@vn,@hn,'',NULL,1201,NULL,'001','','','','','','','2',41,3,3,'650106','08',0
,0,'02',50,0,0,50,50,NULL,'01',DATE(NOW()),'','','','','','',NULL,NULL,NULL,'Y','Y','A7','07480',0,0,0
,0,0,0,0,0,0,0,0,50,0,0,0,0,'10676','07480',@cid,NULL,@cid,'',0,0,0,0,'\"\"','2022-11'
,NULL,'Y',0,NULL,28847,0,0,'Y','',NULL,NULL,NULL,NULL,NULL,NULL);


INSERT INTO dt_list (vn,dt_list,count_in_year,count_in_month,count_in_day,dental_note,refer_in
,refer_out,refer_in_hospcode,refer_out_hospcode,pregnancy,pregnancy_caries_count,pregnancy_gingivitis
,pregnancy_calculus,pregnancy_checkup,hos_guid,dental_in_datetime,dental_out_datetime) 
VALUES (@vn,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

UPDATE patient SET last_visit= CURRENT_DATE WHERE  hn = @hn;