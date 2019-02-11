"use strict";

const moduleName = "Target";

const VError = require("verror");
const db = require("./db");
const queries = require("./database");

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

Target.prototype.appliedPlans = async function() {
  const logName = `${moduleName}.appliedPlans`;

  try {
    return await queries.getAppliedPlans(this);
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Target.prototype.unappliedPlans = async function(repo, plans) {
  const logName = `${moduleName}.unappliedPlans`;

  try {
    let appliedList = await this.appliedPlans();
    console.log("appliedList");
    console.dir(appliedList);
    for (let p of appliedList) {
      if (plans.has(p.uuid)) {
        let plan = plans.get(p.uuid);
        let currentSHA = await repo.gitRepo.getChangeFileSHA(plan);
        if (p.changeSHA === currentSHA) {
          plans.delete(p.uuid);
        }
      }
    }
    return plans;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = Target;

