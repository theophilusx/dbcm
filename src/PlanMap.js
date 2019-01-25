"use strict";

const moduleName = "PlanMap";

const VError = require("verror");
const assert = require("assert");
const Plan = require("./Plan");

function PlanMap() {
  this.plans = new Map();
}

PlanMap.prototype.add = function(plan) {
  const logName = `${moduleName}.add`;

  try {
    assert.ok(plan instanceof Plan, "Argument must be an Plan() instance");
    this.plans.set(plan.uuid, plan);
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
    for (let p of this.plans.keys()) {
      plans.push(this.plans.get(p));
    }
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

module.exports = PlanMap;

