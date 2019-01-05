"use strict";

const moduleName = "TargetMap";

const VError = require("verror");

function TargetMap() {
  this.targets = new Map();
}

TargetMap.prototype.get = function(targetName) {
  return this.targets.get(targetName);
};

TargetMap.prototype.set = function(targetName, targetDef) {
  return this.targets.set(targetName, targetDef);
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
      let params = this.targets.get(target).params();
      params.name = target;
      targets.push(params);
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
      this.targets.set(t.name, {
        database: t.database,
        host: t.host,
        port: t.port,
        user: t.user,
        password: t.password
      });
    });
  } catch (err) {
    throw new VError(err, `${logName} Failed to initilialise targets from array`);
  }
};


