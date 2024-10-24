/**********************************/
/*แก้ไขการเชื่อมต่อที่ไฟล์ config.json แทน*/
/**********************************/
var config = require('./config.json')

Connection_string = {
    client: "mysql",
    connection: {
        host: config.db_kp.host,
        port: config.db_kp.port,
        user: config.db_kp.user,
        password: config.db_kp.password,
        database: config.db_kp.database,
        timezone: 'utc',
        requestTimeout: 1000,
        multipleStatements: true
    },
    pool: {
        afterCreate: (conn, done) => {
            conn.query("SET NAMES UTF8", err => {
                done(err, conn);
            });
        },
        min: 0,
        max: 7
    }
}

var conn = require("knex")(Connection_string);
module.exports = conn