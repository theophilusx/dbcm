"use strict";

const moduleName = "PlanMap";

const VError = require("verror");
const assert = require("assert");
const Plan = require("./Plan");
const fse = require("fse");
const files = require("./files");

function PlanMap() {
  this.plans = new Map();
}

PlanMap.prototype.count = function(type) {
  const logName = `${moduleName}.count`;

  try {
    let cnt = 0;
    for (let p of this.plans.values()) {
      if (p.planType === type) {
        cnt++;
      }
    }
    return cnt;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

PlanMap.prototype.add = async function(repoPath, plan) {
  const logName = `${moduleName}.add`;

  try {
    assert.ok(plan instanceof Plan, "Argument must be an Plan() instance");
    await files.createChangeFiles(repoPath, plan);
    this.plans.set(plan.uuid, plan);
    return true;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

PlanMap.prototype.remove = async function(repoPath, plan) {
  const logName = `${moduleName}.remove`;

  try {
    await files.deletePlan(repoPath, plan);
    this.plans.delete(plan.uuid);
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

PlanMap.prototype.get = function(key) {
  return this.plans.get(key);
};

PlanMap.prototype.toObject = function() {
  const logName = `${moduleName}.toObject`;

  try {
    let plans = [];
    for (let plan of this.plans.values()) {
      plans.push(this.plans.get(plan));
    }
    return plans;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

PlanMap.prototype.fromObject = function(pList) {
  const logName = `${moduleName}.fromObject`;

  try {
    pList.forEach(p => {
      let plan = new Plan(p);
      this.plans.set(plan.uuid, plan);
    });
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

PlanMap.prototype.readPlans = async function(filePath) {
  const logName = `${moduleName}.readPlans`;

  try {
    await fse.access(filePath, fse.constants.R_OK | fse.constants.W_OK);
    let plansObj = await fse.readJson(filePath);
    this.plans.clear();
    this.fromObject(plansObj.plans);
  } catch (err) {
    throw new VError(err, `${logName} Failed to read plans file ${filePath}`);
  }
};

PlanMap.prototype.writePlans = async function(filePath) {
  const logName = `${moduleName}.writePlans`;

  try {
    let plans = [];
    for (let p of this.plans.values()) {
      plans.push(p.toObject());
    }
    let plansObj = {
      name: "Change Plans",
      version: "1.0.0",
      plans: plans
    };
    await fse.writeFile(filePath, JSON.stringify(plansObj, null, " "));
  } catch (err) {
    throw new VError(
      err,
      `${logName} Failed to write change plans: ${filePath}`
    );
  }
};

PlanMap.prototype.planGroupMap = function(type) {
  const logName = `${moduleName}.planGroup`;

  try {
    let planMap = new Map();
    for (let p of this.plans.values()) {
      if (p.planType === type) {
        planMap.set(p.uuid, p);
      }
    }
    return planMap;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = PlanMap;
