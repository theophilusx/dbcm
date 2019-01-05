"use strict";

const moduleName = "TargetMap";

const VError = require("verror");

function TargetMap(targetList) {
  const logName = `${moduleName}.TargetMap`;

  try {
    this.targets = new Map();
    if (Array.isArray(targetList)) {
      targetList.forEach(t => {
        this.targets.set(t.name, t);
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
  return this.targets.set(target.name, target);
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
    for (let target of this.targets.keys()) {
      targets.push(this.targets.get(target));
    }
    return targets;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create array of targets`);
  }
};

TargetMap.prototype.fromArray = function(targetObjects) {
  const logName = `${moduleName}.fromArray`;

  try {
    this.targets.clear();
    targetObjects.forEach(t => {
      this.targets.set(t.name, t);
    });
    return this;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initilialise targets from array`);
  }
};

TargetMap.prototype.targetParams = function(targetName) {
  return this.targets.get(targetName).params();
};

TargetMap.prototype.targetIsInitialised = async function(targetName) {
  return await this.targets.get(targetName).isInitialised();
};

module.exports = {
  TargetMap
};

