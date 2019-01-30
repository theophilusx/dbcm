"use strict";

const moduleName = "Target";

const VError = require("verror");
const db = require("./db");

function Target(name, db, user, pwd, host="localhost", port=5432) {
  const logName = `${moduleName}.Target`;

  try {
    if (name === undefined
        || db === undefined
        || user === undefined
        || pwd === undefined) {
      throw new Error("Missing arguments. Must specify a name, database, user "
                      + "and password");
    }
    this.name = name;
    this.database = db;
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = pwd;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

Target.prototype.params = function() {
  return {
    database: this.database,
    host: this.host,
    port: this.port,
    user: this.user,
    password: this.password
  };
};

Target.prototype.isInitialised = async function() {
  const logName = `${moduleName}.isInitialised`;
  const sql = "SELECT count(*) cnt from dbcm.change_plans";
  
  try {
    let rslt = await db.execSQL(this.params(), sql);
    return true;
  } catch (err) {
    if (err.message.match(/relation .* does not exist/)) {
      return false;
    }
    throw new VError(err, `${logName} `);
  }
};

module.exports = Target;

