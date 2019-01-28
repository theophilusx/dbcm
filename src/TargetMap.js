"use strict";

const moduleName = "TargetMap";

const VError = require("verror");
const Target = require("./Target");

function TargetMap(targetList) {
  const logName = `${moduleName}.TargetMap`;

  try {
    this.targets = new Map();
    if (Array.isArray(targetList)) {
      targetList.forEach(t => {
        this.targets.set(t.name, new Target(
          t.name,
          t.database,
          t.user,
          t.password,
          t.host,
          t.port
        ));
      });
    }
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise TargetMap`);
  }
}

TargetMap.prototype.get = function(targetName) {
  return this.targets.get(targetName);
};

TargetMap.prototype.set = function(target) {
  const logName = `${moduleName}.set`;

  try {
    if (target instanceof Target) {
      return this.targets.set(target.name, target);    
    }
    throw new Error("Argument must be an instance of Target");
  } catch (err) {
    throw new VError(err, `${logName} Failed to set target element`);
  }
};

TargetMap.prototype.names = function() {
  let targetNames = [];
  for (let target of this.targets.keys()) {
    targetNames.push(target);
  }
  return targetNames;
};

TargetMap.prototype.toArray = function() {
  const logName = `${moduleName}.toArray`;

  try {
    let targets = [];
    for (let target of this.targets.values()) {
      targets.push(target);
    }
    return targets;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create array of targets`);
  }
};

TargetMap.prototype.fromArray = function(targetList) {
  const logName = `${moduleName}.fromArray`;

  try {
    this.targets.clear();
    targetList.forEach(t => {
      this.targets.set(t.name, new Target(
        t.name,
        t.database,
        t.user,
        t.password,
        t.host,
        t.port
      ));
    });
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initilialise targets from array`);
  }
};

TargetMap.prototype.targetParams = function(targetName) {
  if (this.targets.has(targetName)) {
    return this.targets.get(targetName).params();    
  }
  return undefined;
};

TargetMap.prototype.targetIsInitialised = async function(targetName) {
  return await this.targets.get(targetName).isInitialised();
};

TargetMap.prototype.size = function() {
  return this.targets.size;
};

module.exports = TargetMap;


