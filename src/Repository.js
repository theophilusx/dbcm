"use strict";

const moduleName = "repository";

const VError = require("verror");
const TargetMap = require("./TargetMap");

function Repository(name, url) {
  const logName = `${moduleName}.Repository`;

  try {
    this.name = name;
    this.url = url;
    this.approvalType = "none";
    this.approvers = new Map();
    this.targets = new TargetMap();
    this.repo = undefined;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise Repository object`);
  }
}

Repository.prototype.name = function() {
  return this.name;
};

Repository.prototype.url = function() {
  return this.url;
};

Repository.prototype.approvalType = function() {
  return this.approvalType;
};

Repository.prototype.setApprovalType = function(type) {
  const logName = `${moduleName}.setApprovalType`;

  try {
    if (type === "none" || type === "any" || type === "all") {
      this.approvalType = type;
    } else {
      throw new Error(`Unknown approval type of ${type}`);
    }
  } catch (err) {
    throw new VError(err, `${logName} Failed to set approval type`);
  }
};

Repository.prototype.setApprovers = function(approversList) {
  const logName = `${moduleName}.setApprovers`;

  try {
    approversList.forEach(approver => {
      this.approvers.set(approver.email, {
        name: approver.name,
        email: approver.email
      });
    });
  } catch (err) {
    throw new VError(err, `${logName} Failed to set approvers for repositorhy ${this.name}`);
  }
};

Repository.prototype.isApprover = function(email) {
  return this.approvers.has(email);
};

Repository.prototype.getApprover = function(email) {
  return this.approvers.get(email);
};

Repository.prototype.approverList = function() {
  let approvers = [];
  for (let approver of this.approvers.keys()) {
    approvers.push(this.approvers.get(approver));
  }
};

Repository.prototype.getTarget = function(targetName) {
  return this.targets.get(targetName);
};

Repository.prototype.setTarget = function(target) {
  return this.targets.set(target.name(), target);
};

Repository.prototype.targetNames = function() {
  return this.targets.names();
};

Repository.prototype.targetsArray = function() {
  return this.targets.toArray();
};

Repository.prototype.initTargets = function(targetsArray) {
  return this.targets.fromArray(targetsArray);
};

Repository.prototype.getTargetParams = function(targetName) {
  return this.targets.targetParams(targetName);
};

Repository.prototype.isTargetInitialised = async function(targetName) {
  const logName = `${moduleName}.isTArgetInitialised`;

  try {
    return await this.targets.targetIsInitialised(targetName);    
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Repository.prototype.toObject = function() {
  const logName = `${moduleName}.toObject`;

  try {
    let repoObject = {
      name: this.name,
      url: this.url,
      targets: this.targets.toArray()
    };
    return repoObject;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = {
  Repository
};
