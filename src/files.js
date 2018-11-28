"use strict";

const moduleName = "files";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

function createPlanFiles(rootPath) {
  const logName = `${moduleName}.createPlanFiles`;
  const committedPlans = {
    name: "Committed Plans",
    version: "1.0.0",
    plans: []
  };
  const pendingPlans = {
    name: "Pending Plans",
    version: "1.0.0",
    plans: []
  };
  
  const committedPlansFile = path.join(rootPath, "plans.json");
  const pendingPlansFile = path.join(rootPath, "pending-plans.json");

  return fse.writeFile(committedPlansFile, JSON.stringify(committedPlans, null, " "), "utf-8")
    .then(() => {
      console.log("Created plans.json file");
      return fse.writeFile(pendingPlansFile, JSON.stringify(pendingPlans, null, " "), "utf-8");
    })
    .then(() => {
      console.log("Created pending-plans.json file");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create plans.json file in ${rootPath}`);
    });
}

function createChangesDir(rootPath) {
  const logName = `${moduleName}.createChangesDir`;
  const contents = "This directory contains SQL scripts representing DB structure changes";
  const dir = path.join(rootPath, "changes");
  
  return fse.mkdir(dir)
    .then(() => {
      let filePath = path.join(dir, "README");
      return fse.writeFile(filePath, contents, "utf-8");
    })
    .then(() => {
      console.log("Changes directory created");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create changes directory in ${rootPath}`);
    });
}

function createVerifyDir(rootPath) {
  const logName = `${moduleName}.createVerifyDir`;
  const contents = "This directory contains SQL scripts to verify DB structure changes";
  const dir = path.join(rootPath, "verify");
  
  return fse.mkdir(dir)
    .then(() => {
      let filePath = path.join(dir, "README");
      return fse.writeFile(filePath, contents, "utf-8");
    })
    .then(() => {
      console.log("Verify directory created");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create verify directory in ${rootPath}`);
    });
}

function createRollbackDir(rootPath) {
  const logName = `${moduleName}.createRollbackDir`;
  const contents = "This directory contains SQL scripts to rollback DB structure changes";
  const dir = path.join(rootPath, "rollback");
  
  return fse.mkdir(dir)
    .then(() => {
      let filePath = path.join(dir, "README");
      return fse.writeFile(filePath, contents, "utf-8");
    })
    .then(() => {
      console.log("Rollback directory created");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create rollback directory in ${rootPath}`);
    });
}

function isInitialised(rootPath) {
  const logName = `${moduleName}.isInitialised`;

  return fse.access(path.join(rootPath, "plans.json"), fse.constants.R_OK | fse.constants.W_OK)
    .then(() => {
      console.log("Repository is initialised for DBCM");
      return true;
    })
    .catch(err => {
      if (err.code === "ENOENT") {
        console.log("Repository is not initialized");
        return false;
      }
      console.dir(err);
      throw new VError(err, `${logName} Failed to test repo init status`);
    });
}

async function initialiseRepo(rootPath) {
  const logName = `${moduleName}.initialiseRepo`;

  try {
    await createPlanFiles(rootPath);
    await createChangesDir(rootPath);
    await createVerifyDir(rootPath);
    await createRollbackDir(rootPath);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise repository ${rootPath}`);
  }
}

module.exports = {
  isInitialised,
  initialiseRepo
};
