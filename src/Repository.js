"use strict";

const moduleName = "repository";

const VError = require("verror");
const {TargetMap} = require("./TargetMap");

function Repository(name="undefined", url="undefined") {
  const logName = `${moduleName}.Repository`;

  try {
    this.name = name;
    this.url = url;
    this.approvalType = "none";
    this.approvers = new Map();
    this.targets = new TargetMap();
    this.releaseTag = undefined;
    this.repo = undefined;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise Repository object`);
  }
}

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
    if (Array.isArray(approversList)) {
      approversList.forEach(approver => {
        if (approver.name === undefined || approver.email === undefined) {
          throw new Error("Missing properties. Approvers must have name and email property");
        }
        this.approvers.set(approver.email, approver);
      });
    }
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
  return approvers;
};

Repository.prototype.getTarget = function(targetName) {
  return this.targets.get(targetName);
};

Repository.prototype.setTarget = function(target) {
  return this.targets.set(target);
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
      targets: this.targetsArray()
    };
    return repoObject;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

Repository.prototype.fromObject = function(repObj) {
  const logName = `${moduleName}.fromObject`;

  try {
    if (repObj && repObj.name) {
      this.name = repObj.name;
    } else {
      throw new Error("Initialisation object must have name property");
    }
    if(repObj && repObj.url) {
      this.url = repObj.url;
    } else {
      throw new Error("Initialisation object must have url property");
    }
    if (repObj && repObj.targets) {
      this.initTargets(repObj.targets);
    } else {
      throw new Error("Initialisation object must have targets property");
    }
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise Repository from object`);
  }
};

module.exports = {
  Repository
};
