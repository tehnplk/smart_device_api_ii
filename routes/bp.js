var express = require("express");
var router = express.Router();
var knex = require("../con_db");
var moment = require("moment");
var config = require("../config.json");
var bmsgw = require("../bmsgw.json");
var knex_gw = require("../con_db_bmsgw");
const axios = require("axios");

router.post("/post_data_bp", async function (req, res, next) {
  data = req.body;
  console.log(data);
  if (config.mode_test) {
    res.json(data);
    return false;
  }

  if (config.his == "ihealth") {
    if (!data.vn) {
      data["vn"] = "x";
    }
    if (!data.cid) {
      data["cid"] = "x";
    }
    body_data = {
      cid: data.cid,
      vn: data.vn,
      device_data: {
        bps: data.data.bps,
        bpd: data.data.bpd,
        pulse: data.data.pulse,
        tp: data.data.tp,
        spo2: data.data.spo2,
        rr: data.data.rr,
        hr: data.data.hr,
      },
    };
    try {
      n = await axios.post(`${config.ihealth_api}`, body_data, {
        headers: {
          Authorization: `${config.ihealth_token}`,
        },
      });
      console.log("iHealth Response ", n.status);
      body_data["ihealth"] = n.data;
      res.status(200).json(body_data);
    } catch (error) {
      res.send(error);
    }

    return false;
  }

  var _now = moment().format("YYYYMMDDHHmmss");
  console.log(_now + "post_data_bp");
  console.log(data);
  if (config.not_post_if_null_pt & !data.hn) {
    console.log({ hn: "no hn", data: data.data });
    res.json({ hn: "no hn", data: data.data });
    return;
  }

  if (bmsgw.active) {
    try {
      let hl7 = `MSH|^~\\&|${data.data.machine}|${bmsgw.company}|HIS|BMS-HOSxP|${_now}||ORU^R01|2701|P|2.3\r\n`;
      hl7 = hl7 + `PID|1||${data.hn}|\r\n`;
      hl7 = hl7 + `PV1|||||||||||||||||||\n`;
      hl7 = hl7 + `OBR|1|||||${_now}||||||||${_now}\r\n`;
      hl7 = hl7 + `OBX|4|ST|TEMP||${data.data.tp}|C|||||F|||${_now}\r\n`;
      hl7 =
        hl7 + `OBX|5|ST|SYSTOLIC||${data.data.bps}|mmHg|||||F|||${_now}\r\n`;
      hl7 =
        hl7 + `OBX|6|ST|DIASTOLIC||${data.data.bpd}|mmHg|||||F|||${_now}\r\n`;
      hl7 = hl7 + `OBX|7|ST|PULSE||${data.data.pulse}|bpm|||||F|||${_now}\r\n`;

      raw_data = {
        scn_result_receive_status: "N",
        scn_result_stamp_datetime: _now,
        scn_result_receive_datetime: _now,
        scn_result_data: hl7,
        scn_result_no: data.hn,
        scn_identify_patient_type: "hn",
        scn_result_msg_type: "ORU^R01",
      };
      r = await knex_gw("scn_result").insert(raw_data);
      res.json(r);
    } catch (error) {
      res.json(error);
    }
  } else {
    if (config.his == "hosxp") {
      try {
        r = await knex("opdscreen").where("vn", "=", data.vn).update({
          //temperature: data.data.tp,
          bps: data.data.bps,
          bpd: data.data.bpd,
          pulse: data.data.pulse,
        });
        res.json(r);
      } catch (error) {
        res.json(error);
      }
    }

    if (config.his == "jhcis") {
      try {
        r = await knex("visit")
          .where("visitno", "=", data.vn)
          .update({
            //temperature: data.data.tp,
            pressure: data.data.bps + "/" + data.data.bpd,
            pulse: data.data.pulse,
          });
        res.json(r);
      } catch (error) {
        res.json(error);
      }
    }

    if (config.his == "him") {
      console.log("Him", req.body);
      raw = req.body;

      let vn = raw.vn;
      let hpressure = raw.data.bps;
      let lpressure = raw.data.bpd;
      let pulse = raw.data.pulse;

      console.log("POST BP DATA = ", vn, hpressure, lpressure, pulse);

      if (!vn) {
        res.json({ vn: "" });
        return false;
      }

      let p = vn.split("|");
      if (p.length != 3) {
        console.log("No hn.");
        res.json({
          effect: 0,
        });
        return false;
      }
      let hn = p[0];
      let regdate = p[1];
      let frequency = p[2];

      try {
        r = await knex("opd")
          .where({
            hn: hn,
            regdate: regdate,
            frequency: frequency,
          })
          .update({
            hpressure: hpressure,
            lpressure: lpressure,
            pulse: pulse,
          });
        res.json(r);
      } catch (error) {
        res.json(error);
      }
    }
  }
});

router.post("/post_data_bp_list", async function (req, res, next) {
  data = req.body;
  console.log(data);
  if (config.mode_test) {
    res.json(data);
    return false;
  }

  if (config.his == "ihealth") {
    res.json(data);
    return false;
  }

  let vn = data.vn;
  let temperature = data.data.tp;
  let bps = data.data.bps;
  let bpd = data.data.bpd;
  let pulse = data.data.pulse;
  let depcode = data.data.dep;
  let staff = data.data.staff;

  if (data.vn == null) {
    console.log("vn is null");
    res.json({
      "opdscreen_bp vn is null": "null",
    });
    return false;
  }
  if (config.his != "hosxp") {
    console.log("not hosxp");
    res.json({
      his: "not hosxp",
    });
    return false;
  }

  //for mysql
  var sql = ` replace into opdscreen_bp
  set opdscreen_bp_id = get_serialnumber('opdscreen_bp_id') 
  ,vn ='${vn}' ,bps=${bps} ,bpd=${bpd} ,pulse=${pulse} ,depcode='${depcode}' ,staff='${staff}' 
  ,screen_date = CURRENT_DATE,screen_time = CURRENT_TIME ,rr=0,o2sat=0,temperature= ${temperature} `;

  // for postgres
  if (config.db.client == "pg") {
    sql = `insert into opdscreen_bp (opdscreen_bp_id,vn,bps,bpd,pulse,depcode,staff,screen_date,screen_time,temperature)
    values (get_serialnumber('opdscreen_bp_id'),'${vn}',${bps},${bpd},${pulse},'${depcode}','${staff}',CURRENT_DATE,CURRENT_TIME(0),${temperature}) 
    ON CONFLICT (opdscreen_bp_id) DO UPDATE 
    SET vn=excluded.vn,bps=excluded.bps,bpd=excluded.bpd,pulse=excluded.pulse,
  depcode=excluded.depcode,staff=excluded.staff,screen_date=excluded.screen_date,screen_time=excluded.screen_time,temperature=excluded.temperature`;
  }
  console.log("client", config.db.client);
  console.log(sql);

  try {
    let data = await knex.raw(sql);
    res.json({
      opdscreen_bp: "added",
    });
  } catch (error) {
    res.json({
      opdscreen_bp: error,
    });
  }
});

router.post("/post_data_bp_log", async function (req, res, next) {
  data = req.body;
  console.log(data);

  if (config.mode_test) {
    res.json(data);
    return false;
  }

  if (config.his == "ihealth") {
    res.json(data);
    return false;
  }

  raw = {
    vn: data.vn,
    cid: data.cid,
    hn: data.hn,
    fullname: data.fullname,
    note1: data.data.dep,
    note2: data.data.staff,
    note3: data.data.machine,
    d_update: moment().format("YYYY-MM-DD HH:mm:ss"),
    tp: data.data.tp,
    bps: data.data.bps,
    bpd: data.data.bpd,
    pulse: data.data.pulse,
  };
  try {
    r = await knex("smart_gate_bp").insert(raw);
    res.json(r);
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;
