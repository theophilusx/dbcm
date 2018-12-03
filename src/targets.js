"use strict";

const moduleName = "targets";

const VError = require("verror");
const db = require("./db");

function isInitialised(target) {
  const logName = `${moduleName}.isInitialised`;
  const sql = "SELECT count(*) from dbcm.change_sets";
  let client = db.getClient(target.database, target.user, target.password);
  let isInitialised = false;
  
  return client.connect()
    .then(() => {
      return db.execSQL(client, sql);      
    })
    .then(() => {
      isInitialised = true;
      return client.end();
    })
    .then(() => {
      return isInitialised;
    })
    .catch(err => {
      console.dir(err);
      if (err.message.match(/relation .* does not exist/)) {
        client.end();
        return false;
      }
      throw new VError(err, `${logName} Failed to check DB init status`);
    });
}

module.exports = {
  isInitialised
};

