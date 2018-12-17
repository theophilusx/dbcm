"use strict";

const moduleName = "git";

const VError = require("verror");
const path = require("path");
const Git = require("nodegit");
const files = require("./files");
const approvals = require("./approvals");

const cloneOptions = {
  fetchOpts : {
    callbacks: {
      // This is a required callback for OS X machines.  There is a known issue
      // with libgit2 being able to verify certificates from GitHub.
      certificateCheck: function() {
        return 1;
      },
      // Credentials are passed two arguments, url and username. We forward the
      // `userName` argument to the `sshKeyFromAgent` function to validate
      // authentication.
      credentials: function(url, userName) {
        return Git.Cred.sshKeyFromAgent(userName);
      }
    }
  } 
};

/**
 * @async
 *
 * Returns an open Repository object. If repository does not exit
 * it will be cloned from the remote repository and opened.
 * If it does exist, it will just be opened and the object returned
 *
 * @param {string} repoUrl - URL of the remote Git repository.
 * @param {string} dst - local destination for the repository.
 *
 * @return {Object} repo - a repository object
 * 
 */
function getRepository(repoUrl, dst) {
  const logName = `${moduleName}.getRepository`;
  
  return Git.Clone(repoUrl, dst, cloneOptions)
    .then(repo => {
      return repo;
    })
    .catch(err => {
      if (err.errno === -4) {
        // looks like repo already there - try opening and pull
        return Git.Repository.open(dst)
          .catch(err => {
            throw new VError(err, `${logName} Failed to open repo ${dst}`);
          });
      }
      throw new VError(err, `${logName} Failed to clone ${repoUrl}`);
    });
}

/**
 * @async
 *
 * Perform a pull i.e. fetch and merge into the local master branch
 *
 * @param {Object} repo - an open Repository object.
 *
 * @return {boolean} Returns true if pull successful 
 *
 */
function pullMaster(repo) {
  const logName = `${moduleName}.pullMaster`;

  return repo.fetchAll(cloneOptions.fetchOpts)
    .then(() => {
      repo.mergeBranches("master", "origin/master");
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to pull from master`);
    });
}

/**
 * Generates a status string for objects which are new, modified etc
 * Similar to the git status command
 *
 * @param {Object} s - a file status object as returned from getStatus()
 *
 * @return {string} a status string with status and file path
 * 
 */
function statusString(s) {
  let words = [];
  if (s.isConflicted()) {
    words.push("CONFLICT");
  }
  if (s.isDeleted()) {
    words.push("DELETED");
  }
  if (s.isIgnored()) {
    words.push("IGNORED");
  }
  if (s.isModified()) {
    words.push("MODIFIED");
  }
  if (s.isNew()) {
    words.push("NEW");
  }
  if (s.isRenamed()) {
    words.push("MOVED");
  }
  if (s.isTypechange()) {
    words.push("TYPECHANGE");
  }
  return `${words.join(" ")} ${s.path()}`; 
}

/**
 * @async
 *
 * Return a list of reference names
 *
 * @param {Object} repo - a Repository object.
 *
 * @return {array} list of reference names
 * 
 */
function getReferenceNames(repo) {
  const logName = `${moduleName}.getReferences`;

  return repo.getReferenceNames(Git.Reference.TYPE.LISTALL)
    .then(names => {
      return names;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get references`);
    });
}

/**
 * @async
 *
 * Create a new branch. Throw and exception if the branch already exists.
 * New branch will be made from current HEAD.
 *
 * @param {Object} repo - a Repository object.
 * @param {String} branchName - name for the new branch
 *
 * @return {Object} reference to the new branch.
 * 
 */
function createBranch(repo, branchName) {
  const logName = `${moduleName}.createBranch`;

  return repo.getHeadCommit()
    .then(commit => {
      return repo.createBranch(branchName, commit, 0);
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create branch ${branchName}`);
    });
}

/**
 * @async
 *
 * Delete a repository. This function will first checkout the master
 * branch and then delete the nominated branch.
 *
 * @param {Object} repo - a Repository object
 * @param {String} branchName - name of branch to delete.
 *
 * @return {boolean} Return true on success - false otherwise
 * 
 */
function deleteBranch(repo, branchName) {
  const logName = `${moduleName}.deleteBranch`;

  return repo.checkoutBranch("master")
    .then(() => {
      return Git.Branch.lookup(repo, branchName, Git.Branch.BRANCH.LOCAL);
    })
    .then(ref => {
      return Git.Branch.delete(ref);
    })
    .then(code => {
      if (code === 0) {
        return true;
      } else {
        return false;
      }
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to delete branch`);
    });
}

/**
 * @async
 *
 * Add (stage) and commit the list of changed objects (files) to
 * the currently active branch
 *
 * @param {Object} state - Application state object
 * @param {Array} files - a list of file status objects.
 * @param {string} commitMsg - a commit message.
 * 
 */
async function addAndCommit(state, files, commitMsg) {
  const logName = `${moduleName}.addAndCommit`;

  try {
    let repo = state.get("repoObject");
    let index = await repo.refreshIndex();
    let promises = [];
    files.forEach(f => {
      promises.push(index.addByPath(f.path()));
    });
    await Promise.all(promises);
    await index.write();
    let oid = await index.writeTree();
    let head = await Git.Reference.nameToId(repo, "HEAD");
    let parent = await repo.getCommit(head);
    let author = Git.Signature.now(state.username(), state.email());
    let committer = Git.Signature.now(state.username(), state.email());
    let commitOid = await repo.createCommit("HEAD", author, committer, commitMsg, oid, [parent]);
    return commitOid;
  } catch (err) {
    throw new VError(err, `${logName} Failed to commit files`);
  }
}

async function mergeBranchIntoMaster(state, branch) {
  const logName = `${moduleName}.mergeBranchIntoMaster`;

  try {
    let repo = state.get("repoObject");
    let mergeSig = Git.Signature.now(state.username(), state.email());
    await repo.mergeBranches("master", branch, mergeSig);
    let remote = await repo.getRemote("origin", cloneOptions.fetchOpts);
    await remote.push(["refs/heads/master:refs/heads/master"], cloneOptions.fetchOpts);
    await deleteBranch(repo, branch);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to merge branch into master`);
  }
}

async function addReleaseTag(state, name, msg) {
  const logName = `${moduleName}.addReleaseTag`;

  try {
    let repo = state.get("repoObject");
    let commit = await repo.getMasterCommit();
    await repo.createTag(commit.id(), name, msg);
    let remote = await repo.getRemote("origin", cloneOptions.fetchOpts);
    await remote.push(["refs/heads/master:refs/heads/master"], cloneOptions.fetchOpts);
    state.set("currentReleaseTag", name);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to add tag`);
  } 
}

async function getChangesSha(state, plan) {
  const logName = `${moduleName}.getChangesSha`;

  try {
    let repo = state.get("repoObject");
    let commit = await repo.getHeadCommit();
    let entry = await commit.getEntry(plan.change);
    return entry.sha();
  } catch (err) {
    throw new VError(err, `${logName} Failed to get SHA for changes file`);
  }
}

/**
 * @async
 *
 * Setup a repository for DBCM. If teh repository has not yet been
 * cloned locally, do the cloning, then open it. If the repository has
 * uncommitted changes, display them. Do a refresh from master into
 * local master by performing a pull
 */
async function setupRepository(state) {
  const logName = `${moduleName}.setupRepository`;

  try {
    let repositories = state.repositories();
    let repoName = state.currentRepository();
    let repoUrl = repositories.get(repoName).url;
    let repoDest = path.join(state.home(), repoName);
    let repo = await getRepository(repoUrl, repoDest);
    state.set("repoObject", repo);
    let initialised = await files.isInitialised(repoDest);
    if (!initialised) {
      let branchRef = await createBranch(repo, "setup");
      await repo.checkoutBranch(branchRef);
      await files.initialiseRepo(repoDest);
      await approvals.writeApprovalsFile(state);
      let fileList = await repo.getStatus();
      await addAndCommit(state, fileList, "DBCM Init");
      let mergeSig = Git.Signature.now(state.username(), state.email());
      await repo.mergeBranches("master", "setup", mergeSig);
      let remote = await repo.getRemote("origin", cloneOptions.fetchOpts);
      await remote.push(["refs/heads/master:refs/heads/master"], cloneOptions.fetchOpts);
      await deleteBranch(repo, "setup");
      state = await addReleaseTag(state, "0.0.1", "Initial release");
    } else {
      await pullMaster(repo);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup ${state.currentRepository()}`);
  }
}


module.exports = {
  pullMaster,
  statusString,
  getReferenceNames,
  createBranch,
  deleteBranch,
  addAndCommit,
  mergeBranchIntoMaster,
  addReleaseTag,
  getChangesSha,
  setupRepository
};
