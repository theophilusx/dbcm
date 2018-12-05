"use strict";

const moduleName = "files";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

function createPlanFiles(rootPath) {
  const logName = `${moduleName}.createPlanFiles`;
  const approvedPlans = {
    name: "Approved Plans",
    version: "1.0.0",
    plans: []
  };
  const pendingPlans = {
    name: "Pending Plans",
    version: "1.0.0",
    plans: []
  };
  const developmentPlans = {
    name: "Development Plans",
    version: "1.0.0",
    plans: []
  };
  const approvedFile = path.join(rootPath, "approved-plans.json");
  const pendingFile = path.join(rootPath, "pending-plans.json");
  const developmentFile = path.join(rootPath, "development-plans.json");

  return fse.writeFile(approvedFile, JSON.stringify(approvedPlans, null, " "), "utf-8")
    .then(() => {
      console.log("Created approved-plans.json file");
      return fse.writeFile(pendingFile, JSON.stringify(pendingPlans, null, " "), "utf-8");
    })
    .then(() => {
      console.log("Created pending-plans.json file");
      return fse.writeFile(developmentFile, JSON.stringify(developmentPlans, null, " "), "utf-8");
    })
    .then(() => {
      console.log("Created development-plans.json");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create plans.json file in ${rootPath}`);
    });
}

function createApproverFile(rootPath) {
  const logName = `${moduleName}.createApproverFile`;
  const approverFile = path.join(rootPath, "approvals.json");
  const content = {
    name: "Change Approvals",
    version: "1.0.0",
    type: "none",
    approvers: []
  };

  return fse.writeFile(approverFile, JSON.stringify(content, null, " "), "utf-8")
    .then(() => {
      console.log("Created approvals.json");
      return true;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create approvals.json file`);
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

  return fse.access(path.join(rootPath, "approved-plans.json"), fse.constants.R_OK | fse.constants.W_OK)
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
    await createApproverFile(rootPath);
    await createChangesDir(rootPath);
    await createVerifyDir(rootPath);
    await createRollbackDir(rootPath);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise repository ${rootPath}`);
  }
}

function makeChangeFile(rootPath, changeRecord) {
  const logName = `${moduleName}.makeChangeFile`;
  const changeFile = path.join(rootPath, `${changeRecord.change}`);
  const content = `
-- Name:   ${changeRecord.name}
-- Author: ${changeRecord.author} <${changeRecord.email}>
-- Date:   ${changeRecord.date}
-- Type:   Changes

\\echo Executing ${changeRecord.change}

BEGIN;

-- changes go here

COMMIT;

\\echo End ${changeRecord.change}
`;

  return fse.writeFile(changeFile, content, "utf-8")
    .catch(err => {
      throw new VError(err, `${logName} Failed to create change file ${changeRecord.change}`);
    });
}

function makeVerifyFile(rootPath, changeRecord) {
  const logName = `${moduleName}.makeVerifyFile`;
  const verifyFile = path.join(rootPath, `${changeRecord.verify}`);
  const content = `
-- Name:   ${changeRecord.name}
-- Author: ${changeRecord.author} <${changeRecord.email}>
-- Date:   ${changeRecord.date}
-- Type:   Verify

\\echo Executing ${changeRecord.verify}

-- verify code go here

\\echo End ${changeRecord.verify}
`;

  return fse.writeFile(verifyFile, content, "utf-8")
    .catch(err => {
      throw new VError(err, `${logName} Failed to create verify file ${changeRecord.change}`);
    });
}

function makeRollbackFile(rootPath, changeRecord) {
  const logName = `${moduleName}.makeRollbackFile`;
  const rollbackFile = path.join(rootPath, `${changeRecord.rollback}`);
  const content = `
-- Name:   ${changeRecord.name}
-- Author: ${changeRecord.author} <${changeRecord.email}>
-- Date:   ${changeRecord.date}
-- Type:   Rollback

\\echo Executing ${changeRecord.rollback}

BEGIN;

-- rollback of changes go here

COMMIT;

\\echo End ${changeRecord.rollback}
`;

  return fse.writeFile(rollbackFile, content, "utf-8")
    .catch(err => {
      throw new VError(err, `${logName} Failed to create rollback file ${changeRecord.rollback}`);
    });
}


function createChangeFiles(state, changeRecord) {
  const logName = `${moduleName}.createchangeFiles`;
  const root = path.join(state.home(), state.currentRepository());

  return makeChangeFile(root, changeRecord)
    .then(() => {
      return makeVerifyFile(root, changeRecord);
    })
    .then(() => {
      return makeRollbackFile(root, changeRecord);
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create change files`);
    });
}

module.exports = {
  isInitialised,
  initialiseRepo,
  createChangeFiles
};
