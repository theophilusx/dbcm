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
          psqlPath: undefined,
          currentRepository: undefined,
          currentTarget: undefined,
          currentPlan: undefined,
          currentPlanType: undefined,
          currentReleaseTag: "0.0.0"
        };
      }
      throw new VError(err, `${logName} Failed to access ${rcPath}`);
    });
}


async function writeConfig(appState) {
  const logName = `${moduleName}.writeState`;
  let newConfig = {};

  try {
    newConfig.version = "1.0.0";
    newConfig.user = appState.get("user");
    newConfig.repositoryHome = appState.get("home");
    newConfig.psqlPath = appState.get("psqlPath");
    newConfig.currentRepository = appState.get("currentRepository");
    newConfig.currentTarget = appState.get("currentTarget");
    newConfig.currentPlan = appState.get("currentPlan");
    newConfig.currentPlanType = appState.get("currentPlanType");
    newConfig.currentReleaseTag = appState.get("currentReleaseTag");
    let repoList = [];
    let repoMap = appState.get("repositories");
    for (let repoName of repoMap.keys()) {
      let repo = repoMap.get(repoName);
      let url = repo.url;
      let targets = [];
      let targetMap = repo.targets;
      for (let targetName of targetMap.keys()) {
        let params = targetMap.get(targetName);
        targets.push({
          targetName: targetName,
          database: params.database,
          host: params.host,
          port: params.port,
          user: params.user,
          password: params.password
        });
      }
      repoList.push({
        name: repoName,
        url: url,
        targets: targets
      });
    }
    newConfig.repositories = repoList;
    await fse.writeFile(rcPath, JSON.stringify(newConfig, null, " "));
  } catch (err) {
    throw new VError(err, `${logName} Failed to write ${rcPath}`);
  }
}


async function createApplicationState() {
  const logName = `${moduleName}.createApplicationState`;
  const state = new Map();

  function get(key) {
    const logName = `${moduleName}.get`;

    try {
      if (state.has(key)) {
        return state.get(key);
      }
      console.log(`${logName}: Unknown key ${key}`);
      return undefined;
    } catch (err) {
      throw new VError(err, `${logName} Error retrieving state value for ${key}`);
    }
  }

  function set(key, value) {
    const logName = `${moduleName}.set`;

    try {
      if (!state.has(key)) {
        console.log(`${logName}. New unknown key set: ${key}`);
      }
      state.set(key, value);
    } catch (err) {
      throw new VError(err, `${logName} Failed to set state value for key ${key}`);
    }
  }
  
  try {
    let config = await readConfig();
    state.set("user", config.user);
    state.set("home", config.repositoryHome);
    let repoMap = new Map();
    if (Array.isArray(config.repositories) && config.repositories.length) {
      for (let repo of config.repositories) {
        let targetMap = new Map();
        if (Array.isArray(repo.targets) && repo.targets.length) {
          for (let t of repo.targets) {
            let targetName = t.targetName;
            let params = {
              database: t.database,
              host: t.host,
              port: t.port,
              user: t.user,
              password: t.password
            };
            targetMap.set(targetName, params);
          }
        }
        repoMap.set(repo.name, {
          url: repo.url,
          targets: targetMap
        });
      }
    }
    state.set("repositories", repoMap);
    state.set("currentRepository", config.currentRepository);
    state.set("currentTarget", config.currentTarget);
    state.set("currentPlan", config.currentPlan);
    state.set("currentPlanType", config.currentPlanType);
    state.set("psqlPath", config.psqlPath);
    state.set("approvalType", "none");
    state.set("approvers", new Map());
    state.set("developmentPlans", new Map());
    state.set("pendingPlans", new Map());
    state.set("approvedPlans", new Map());
    state.set("rejectedPlans", new Map());
    state.set("menuChoice", "unknown");
    state.set("repoObject", undefined);
    state.set("currentReleaseTag", config.currentReleaseTag);

    return {
      get: get,
      set: set,
      username: () => {
        return get("user").name;
      },
      email: () => {
        return get("user").email;
      },
      home: () => {
        return get("home");
      },
      repositories: () => {
        return get("repositories");
      },
      setRepositories: repoMap => {
        return set("repositories", repoMap);
      },
      repositoryDef: repoName => {
        return get("repositories").get(repoName);
      },
      setRepositoryDef: (repoName, defObject) => {
        return get("repositories").set(repoName, defObject);
      },
      currentRepository: () => {
        return get("currentRepository");
      },
      setCurrentRepository: repoName => {
        return set("currentRepository", repoName);
      },
      currentRepositoryDef: () => {
        return get("repositories").get(get("currentRepository"));
      },
      currentRepositoryUrl: () => {
        if (get("currentRepository")) {
          return get("repositories").get(get("currentRepository")).url;
        } else {
          throw new VError(`${logName} current repository not defined`);
        }
      },        
      currentRepositoryTargets: () => {
        if (get("currentRepository")) {
          return get("repositories").get(get("currentRepository")).targets;
        } else {
          throw new VError(`${logName} current repository not defined`);
        }
      },
      setCurrentRepositoryTargets: targetMap => {
        if (get("currentRepository")) {
          return get("repositories").get(get("currentRepository")).targets = targetMap; 
        } else {
          throw new VError(`${logName} Current repository not set`);
        }
      },
      currentTarget: () => {
        return get("currentTarget");
      },
      setCurrentTarget: targetName => {
        return set("currentTarget", targetName);
      },
      currentTargetDef: () => {
        if (get("currentRepository") && get("currentTarget")) {
          return get("repositories").get(get("currentRepository")).targets.get(get("currentTarget"));
        } else {
          throw new VError(`${logName} Both currentRepository and currentTarget need to be defined `
                           + `repo: ${state.get("currentRepository")} target: ${state.get("currentTarget")}`);
        }
      },
      psqlPath: () => {
        return get("psqlPath");
      },
      setPsqlPath: psql => {
        return set("psqlPath", psql);
      },
      approvalType: () => {
        return get("approvalType");
      },
      setApprovalType: type => {
        return set("approvalType", type);
      },
      approvers: () => {
        return get("approvers");
      },
      setApprovers: appMap => {
        return set("approvers", appMap);
      },
      developmentPlans: () => {
        return get("developmentPlans");
      },
      setDevelopmentPlans: planMap => {
        return set("developmentPlans", planMap);
      },
      pendingPlans: () => {
        return get("pendingPlans");
      },
      setPendingPlans: planMap => {
        return set("pendingPlans", planMap);
      },
      approvedPlans: () => {
        return get("approvedPlans");
      },
      setApprovedPlans: planMap => {
        return set("approvedPlans", planMap);
      },
      rejectedPlans: () => {
        return get("rejectedPlans");
      },
      setRejectedPlans: planMap => {
        return set("rejectedPlans", planMap);
      },
      currentPlan: () => {
        return get("currentPlan");
      },
      setCurrentPlan: id => {
        return set("currentPlan", id);
      },
      currentPlanType: () => {
        return get("currentPlanType");
      },
      setCurrentPlanType: type => {
        return set("currentPlanType", type);
      },
      currentPlanDef: () => {
        const logName = `${moduleName}.currentPlanDef`;

        try {
          let pType = get("currentPlanType");
          let pId = get("currentPlan");
          switch (pType) {
          case "developmentPlans":
            return get("developmentPlans").get(pId);
          case "pendingPlans":
            return get("pendingPlans").get(pId);
          case "approvedPlans":
            return get("approvedPlans").get(pId);
          case "rejectedPlans":
            return get("rejectedPlans").get(pId);
          default:
            throw new Error(`Unknown plan type: ${pType}`);
          }
        } catch (err) {
          throw new VError(err, `${logName}`);
        }
      },
      menuChoice: () => {
        return get("menuChoice");
      },
      setMenuChoice: choice => {
        return set("menuChoice", choice);
      },
      currentReleaseTag: () => {
        return get("currentReleaseTag");
      },
      setCurrentReleaseTag: tag => {
        return set("currentReleaseTag", tag);
      },
      writeConfigFile: async () => {
        const logName = `${moduleName}.writeConfigFile`;
        
        try {
          await writeConfig(state);
        } catch (err) {
          throw new VError(err, `${logName} Failed to write config file`);
        }
      },
      dump: () => {
        console.dir(state); 
      }
    };
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise DBCM state`);
  }
}

module.exports = {
  createApplicationState
};
