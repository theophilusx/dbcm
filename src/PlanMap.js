"use strict";

const moduleName = "PlanMap";

const {Plan} = require("./Plan");

function PlanMap() {
  this.plans = new Map();
}

PlanMap.prototype.add = function(plan) {
  this.plans.set(plan.uuid, plan);
};

PlanMap.prototype.get = function(key) {
  return this.plans.get(key);
};

PlanMap.prototype.toObject = function() {
  let plans = [];
  for (let p of this.plans.keys()) {
    plans.push(this.plans.get(p));
  }
};

PlanMap.prototype.fromObject = function(pList) {
  pList.forEach(p => {
    let plan = new Plan(p);
    this.plans.set(plan.uuid, plan);
  });
};

module.exports = PlanMap;

