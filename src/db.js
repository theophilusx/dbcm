"use strict";

const moduleName = "db";

const VError = require("verror");
const {Client} = require("pg");

function getClient(database, user, password) {
  const logName = `${moduleName}.getAdminClient`;
  var client;

  try {
    client = new Client({
      database: database,
      user: user,
      password: password,
      application_name: "dbcm"
    });
    return client;
  } catch(err) {
    throw new VError(err, `${logName} Failed to create DB client`);
  }
}

function execSQL(client, sql, params) {
  const logName = `${moduleName}.execSQL`;
  
  if (params !== undefined) {
    return client.query(sql, params)
      .then(rs => {
        return rs;
      })
      .catch(err => {
        throw new VError(err, `${logName} Failed to execute SQL ${sql}`);
      });
  }
  return client.query(sql)
    .then(rs => {
      return rs;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed toe execute SQl ${sql}`);
    });
}

module.exports = {
  getClient,
  execSQL
};
