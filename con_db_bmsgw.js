/**********************************/
/*แก้ไขการเชื่อมต่อที่ไฟล์ config.json แทน*/
/**********************************/
var config = require('./bmsgw.json')

Connection_string = {
    client: "mysql",
    connection: {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
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
if (config.db.client == 'pg') {
    Connection_string = {
        client: "pg",
        connection: {
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
            requestTimeout: 30000,
        },
    }
}

var knex = require("knex")(Connection_string);
module.exports = knex