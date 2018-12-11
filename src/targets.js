"use strict";

const moduleName = "targets";

const VError = require("verror");
const db = require("./db");

function isInitialised(dbParams) {
  const logName = `${moduleName}.isInitialised`;
  const sql = "SELECT count(*) from dbcm.change_plans";
  let client = db.getClient(dbParams);
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
      if (err.message.match(/relation .* does not exist/)) {
        client.end();
        return false;
      }
      throw new VError(err, `${logName} Failed to check DB init status `
                       + `for ${dbParams.database}`);
    });
}

module.exports = {
  isInitialised
};

