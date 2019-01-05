"use strict";

const moduleName = "Target";

const VError = require("verror");
const db = require("./db");

function Target(name, db, user, pwd, host="localhost", port=5432) {
  this.name = name;
  this.database = db;
  this.host = host;
  this.port = port;
  this.user = user;
  this.password = pwd;
}

Target.prototype.name = function() {
  return this.name;
};

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
  const sql = "SELECT count(*) from dbcm.change_plans";
  
  try {
    await db.execSQL(this.params(), sql);
    return true;
  } catch (err) {
    if (err.message.match(/relation .* does not exist/)) {
      return false;
    }
    throw err;
  }
};

