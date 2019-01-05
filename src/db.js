"use strict";

const moduleName = "db";

const VError = require("verror");
const {Client} = require("pg");

function getClient(dbParams) {
  const logName = `${moduleName}.getAdminClient`;
  var client;

  try {
    client = new Client({
      database: dbParams.database,
      host: dbParams.host,
      port: dbParams.port,
      user: dbParams.user,
      password: dbParams.password,
      application_name: "dbcm"
    });
    return client;
  } catch(err) {
    throw new VError(err, `${logName} Failed to create DB client`);
  }
}

async function execSQL(dbCreds, sql, params) {
  const logName = `${moduleName}.execSQL`;
  const client = getClient(dbCreds);
  
  try {
    let rslt;
    await client.connect();
    if (params !== undefined) {
      rslt = await client.query(sql, params);
    } else {
      rslt = await client.query(sql);
    }
    return rslt;
  } catch (err) {
    throw new VError(err, `${logName} Failed to execute SQL ${sql}`);
  } finally {
    client.end();
  }
}

module.exports = {
  execSQL
};
