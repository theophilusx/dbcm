"use strict";

const moduleName = "Target";

const VError = require("verror");
const db = require("./db");
const queries = require("./database");
const screen = require("./tui/utils/textScreen");
const cloneDeep = require("lodash.clonedeep");
const assert = require("assert");

/**
 * Class representing a database target
 *
 * @param {string} name : target name
 * @param {string} db : database name
 * @param {string} user : db user name
 * @param {String} pwd : db password
 * @param {string} [host="localhost"] : db host
 * @param {number} [port=5432] : db port
 */
function Target(name, db, user, pwd, host = "localhost", port = 5432) {
  const logName = `${moduleName}.Target`;

  try {
    assert.ok(name, "Missing DB target name");
    assert.ok(db, "Missing DB name");
    assert.ok(user, "Missing DB username");
    assert.ok(pwd, "Missing DB password");
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

/**
 * Returns database connection parameters for a target
 *
 * @returns object
 */
Target.prototype.params = function() {
  return {
    database: this.database,
    host: this.host,
    port: this.port,
    user: this.user,
    password: this.password
  };
};

/**
 * Returns true if db target has been initialised for DBCM
 *
 * @returns boolean
 */
Target.prototype.isInitialised = async function() {
  const logName = `${moduleName}.isInitialised`;
  const sql = "SELECT count(*) cnt from dbcm.change_plans";

  try {
    await db.execSQL(this.params(), sql);
    return true;
  } catch (err) {
    if (err.message.match(/relation .* does not exist/)) {
      return false;
    }
    if (err.message.match(/connect ECONNREFUSED/)) {
      screen.errorMsg(
        "Databae Connection Failure",
        `Connection to ${this.database} refused ` +
          `Host: ${this.host}:${this.port} ` +
          `User: ${this.user}`
      );
      return false;
    }
    throw new VError(err, `${logName} `);
  }
};

/**
 * Returns array of objects representing applied plans
 *
 * @returns array
 */
Target.prototype.appliedPlans = async function(repo, definedPlans) {
  const logName = `${moduleName}.appliedPlans`;

  try {
    let dbAppliedPlans = await queries.getAppliedPlans(this);
    let applied = new Map();
    for (let a of dbAppliedPlans) {
      let plan = definedPlans.get(a.uuid);
      let currentSHA = await repo.gitRepo.getChangeFileSHA(plan);
      if (a.changeSHA === currentSHA) {
        applied.set(a.uuid, definedPlans.get(a.uuid));
      }
    }
    return applied;
  } catch (err) {
    throw new VError(err, logName);
  }
};

Target.prototype.unappliedPlans = async function(repo, definedPlans) {
  const logName = `${moduleName}.unappliedPlans`;

  try {
    let plans = cloneDeep(definedPlans);
    let dbAppliedPlans = await queries.getAppliedPlans(this);
    for (let p of dbAppliedPlans) {
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

Target.prototype.dbAppliedPlans = async function() {
  const logName = "dbAppliedPlans";

  try {
    return await queries.getAppliedPlans(this);
  } catch (err) {
    throw new VError(err, logName);
  }
};

module.exports = Target;
