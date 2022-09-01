//แก้ไขการเชื่อมต่อที่ไฟล์ config.json แทน
config = require('./config.json')
var knex = require("knex")({
    client: "mysql",
    connection: {
        host: config.con.host,
        port: config.con.port,
        user: config.con.user,
        password: config.con.pass,
        database: config.con.db,
        timezone: 'utc'
    },
    pool: {
        afterCreate: (conn, done) => {
            conn.query("SET NAMES UTF8", err => {
                done(err, conn);
            });
        }
    }
});
module.exports = knex