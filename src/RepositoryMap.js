"use strict";

const moduleName = "RepositoryMap";

const VError = require("verror");
const Repository = require("./Repository");

function RepositoryMap() {
  this.repositories = new Map();
}

RepositoryMap.prototype.get = function(repoName) {
  return this.repositories.get(repoName);
};

RepositoryMap.prototype.set = function(repoObject) {
  return this.repositories.set(repoObject.name(), repoObject);
};

RepositoryMap.prototype.toArray = function() {
  const logName = `${moduleName}.toArray`;

  try {
    let repoArray = [];
    for (let repo of this.repositories.keys()) {
      repoArray.push(this.repositories.get(repo).toArray());
    }
    return repoArray;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

RepositoryMap.prototype.fromArray = function(repoArray) {
  const logName = `${moduleName}.fromArray`;

  try {
    repoArray.forEach(r => {
      let repo = new Repository(r.name, r.url);
      repo.initTargets(r.targets);
      this.set(repo);
    });
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = {
  RepositoryMap
};
