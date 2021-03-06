"use strict";

const moduleName = "RepositoryMap";

const VError = require("verror");
const Repository = require("./Repository");

function RepositoryMap() {
  this.repositories = new Map();
}

RepositoryMap.prototype.getRepo = function(repoName) {
  const logName = `${moduleName}.getRepo`;

  try {
    if (this.repositories.has(repoName)) {
      return this.repositories.get(repoName);      
    }
    return undefined;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

RepositoryMap.prototype.setRepo = function(repoObject) {
  const logName = `${moduleName}.setRepo`;

  try {
    if (repoObject && repoObject instanceof Repository) {
      return this.repositories.set(repoObject.name, repoObject);    
    }
    throw Error("Argument must be an instance of Repository");
  } catch (err) {
    throw new VError(err, `${logName} Failed to add repository`);
  }
};

RepositoryMap.prototype.toArray = function() {
  const logName = `${moduleName}.toArray`;

  try {
    let repoArray = [];
    for (let repo of this.repositories.keys()) {
      repoArray.push(this.repositories.get(repo).toObject());
    }
    return repoArray;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

RepositoryMap.prototype.fromArray = function(repoArray) {
  const logName = `${moduleName}.fromArray`;

  try {
    this.repositories.clear();
    repoArray.forEach(r => {
      let repo = new Repository(r.name, r.url, r.path);
      repo.initTargets(r.targets);
      this.setRepo(repo);
    });
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

RepositoryMap.prototype.has = function(key) {
  return this.repositories.has(key);
};

RepositoryMap.prototype.size = function() {
  return this.repositories.size;
};

RepositoryMap.prototype.repositoryNames = function() {
  let names = [];
  for (let n of this.repositories.keys()) {
    names.push(n);
  }
  return names;
};

module.exports = RepositoryMap;

