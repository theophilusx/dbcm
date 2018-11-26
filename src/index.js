"use strict";

const appName = "dbcm";

const path = require("path");
const git = require("./git");
const config = require("rc")(appName);

const repoName = "casi-admin-db";
const repoUrl = config.dbRepositories[repoName];

let repo;
let branchRef;

git.setupRepository(repoUrl, path.join(config.dbcmHome, repoName))
  .then(repoObj => {
    repo = repoObj;
    console.log("All good");
    return git.getReferenceNames(repo);
  })
  .then(refs => {
    refs.forEach(r => console.log(`Reference: ${r}`));
  })
  .then(() => {
    return git.deleteBranch(repo, "dbcm-local");
  })
  .then(ref => {
    branchRef = ref;
    return true;
  })
  .catch(err => {
    console.error(err.message);
  });
