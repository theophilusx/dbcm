"use strict";

const moduleName = "state";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

const rcPath = path.join(process.env.HOME, ".dbcmrc");

function readConfig() {
  const logName = `${moduleName}.readConfig`;

  return fse.access(path.join(rcPath), fse.constants.R_OK | fse.constants.W_OK)
    .then(() => {
      return fse.readJson(rcPath);
    })
    .catch(err => {
      if (err.code === "ENOENT") {
        // no rc file - return default 
        return {
          version: "1.0.0",
          user: {
            name: undefined,
            email: undefined
          },
          repositoryHome: undefined,
          repositories: [],
          targets: []
        };
      }
      throw new VError(err, `${logName} Failed to access ${rcPath}`);
    });
}

async function setInitialState() {
  const logName = `${moduleName}.setInitialState`;
  const appState = new Map();

  try {
    let config = await readConfig();
    appState.set("user", config.user);
    appState.set("version", config.version);
    appState.set("home", config.repositoryHome);
    let repoMap = new Map();
    if (config.repositories.length) {
      for (let repo of config.repositories) {
        repoMap.set(repo.name, repo.url);
      }
    }
    appState.set("repositories", repoMap);
    let targetMap = new Map();
    if (config.targets.length) {
      for (let target of config.targets) {
        targetMap.set(target.name, target.parameters);
      }
    }
    appState.set("targets", targetMap);
    appState.set("currentRepository", undefined);
    appState.set("currentTarget", undefined);
    console.log(`${logName} app state`);
    console.dir(appState);
    return appState;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise DBCM state`);
  }
}

async function writeConfig(appState) {
  const logName = `${moduleName}.writeState`;
  let newConfig = {};

  try {
    newConfig.version = appState.get("version");
    newConfig.user = appState.get("user");
    newConfig.repositoryHome = appState.get("home");
    let repoList = [];
    let repoMap = appState.get("repositories");
    for (let repo of repoMap.keys()) {
      repoList.push({
        name: repo,
        url: repoMap.get(repo)
      });
    }
    newConfig.repositories = repoList;
    let targetList = [];
    let targetMap = appState.get("targets");
    for (let target of targetMap.keys()) {
      targetList.push({
        name: target,
        parameters: targetMap.get(target)
      });
    }
    newConfig.targets = targetList;
    console.log(`${logName} new config`);
    console.dir(newConfig);
    await fse.writeFile(rcPath, JSON.stringify(newConfig, null, " "));
  } catch (err) {
    throw new VError(err, `${logName} Failed to write ${rcPath}`);
  }
}

module.exports = {
  setInitialState,
  writeConfig
};
