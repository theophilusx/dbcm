"use strict";

const moduleName = "git";

const VError = require("verror");
const path = require("path");
const Git = require("nodegit");
const files = require("./files");

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

function DbRepository() {
  const logName = `${logName}.DbRepository`;
  this.name = undefined;
  this.url = undefined;
  this.path = undefined;
  this.repo = undefined;
}


DbRepository.prototype.name = function() {
  if (this.name) {
    return this.name;    
  }
  throw new Error("Repository not initialised");
};

DbRepository.prototype.url = function() {
  if (this.url) {
    return this.url;
  }
  throw new Error("Repository not initialised");
};

DbRepository.prototype.path = function() {
  if (this.path) {
    return this.path;
  }
  throw new Error("Repository not initialised");
};

/**
 * @async
 *
 * Return a list of reference names
 *
 * @return {array} list of reference names
 * 
 */
DbRepository.prototype.getReferenceNames = async function() {
  const logName = `${moduleName}.getReferences`;

  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    let names = await this.repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
    return names;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get references for repository`);
  }
};

/**
 * @async
 *
 * Create a new branch. Throw and exception if the branch already exists.
 * New branch will be made from current HEAD.
 *
 * @param {String} branchName - name for the new branch
 *
 * @return {Object} reference to the new branch.
 * 
 */
DbRepository.prototype.createBranch = async function(branchName) {
  const logName = `${moduleName}.createBranch`;

  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    return await this.repo.createBranch(branchName);
  } catch (err) {
    throw new VError(err, `${logName} Failed to create branch ${branchName}`);
  }
};

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
DbRepository.prototype.deleteBranch = async function deleteBranch(branchName) {
  const logName = `${moduleName}.deleteBranch`;

  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    await this.repo.checkoutBranch("master");
    let ref = await Git.Branch.lookup(
      this.repo,
      branchName,
      Git.Branch.BRANCH.LOCAL
    );
    let code = await Git.Branch.delete(ref);
    return code === 0 ? true : false;
  } catch (err) {
    throw new VError(err, `${logName} Failed to delete branch ${branchName}`);
  }
};

/**
 * @async
 *
 * Add (stage) and commit the list of changed objects (files) to
 * the currently active branch
 *
 * @param {Array} files - a list of file status objects.
 * @param {string} commitMsg - a commit message.
 * 
 */
DbRepository.prototype.addCommit = async function(files, commitMsg, author, email) {
  const logName = `${moduleName}.addCommit`;

  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    let index = await this.repo.refreshIndex();
    let promises = [];
    files.forEach(f => {
      promises.push(index.addByPath(f.path()));
    });
    await Promise.all(promises);
    await index.write();
    let oid = await index.writeTree();
    let head = await Git.Reference.nameToId(this.repo, "HEAD");
    let parent = await this.repo.getCommit(head);
    let authorSig = Git.Signature.now(author, email);
    let committerSig = Git.Signature.now(author, email);
    let commitOid = await this.repo.createCommit(
      "HEAD",
      authorSig,
      committerSig,
      commitMsg,
      oid,
      [parent]
    );
    return commitOid;
  } catch (err) {
    throw new VError(err, `${logName} Failed to commit files to repository`);
  }
};

DbRepository.prototype.mergeIntoMaster = async function(branch, author, email) {
  const logName = `${moduleName}.mergeIntoMaster`;

  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    let mergeSig = Git.Signature.now(author, email);
    await this.repo.mergeBranches("master", branch, mergeSig);
    let remote = await this.repo.getRemote("origin", cloneOptions.fetchOpts);
    await remote.push(["refs/heads/master:refs/heads/master"], cloneOptions.fetchOpts);
    await this.deleteBranch(branch);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to merge branch into master`);
  }
};

DbRepository.prototype.addReleaseTag = async function(name, msg) {
  const logName = `${moduleName}.addReleaseTag`;

  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    let commit = await this.repo.getMasterCommit();
    await this.repo.createTag(commit.id(), name, msg);
    let remote = await this.repo.getRemote("origin", cloneOptions.fetchOpts);
    await remote.push(
      ["refs/heads/master:refs/heads/master"],
      cloneOptions.fetchOpts
    );
    return name;
  } catch (err) {
    throw new VError(err, `${logName} Failed to add tag ${name} `
                     + "to repository");
  } 
};

DbRepository.prototype.getChangesSha = async function(plan) {
  const logName = `${moduleName}.getChangesSha`;

  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    let commit = await this.repo.getHeadCommit();
    let entry = await commit.getEntry(plan.change);
    return entry.sha();
  } catch (err) {
    throw new VError(err, `${logName} Failed to get SHA for changes file `
                     + `${plan.change} in repository`);
  }
};

DbRepository.prototype.fileHistory = async function(fileName) {
  const logName = `${moduleName}.fileHistory`;
  
  async function compileHistory(repo, newCommits, commitHistory, file, depth) {
    const logName = `${moduleName}.compileHistory`;

    try {
      let lastSha;
      if (commitHistory.length > 0) {
        lastSha = commitHistory[commitHistory.length - 1].commit.sha();
        if (newCommits.length === 1 && newCommits[0].commit.sha() === lastSha) {
          return commitHistory;
        }
      }
      if (newCommits.length === 0) {
        return commitHistory;
      }
      newCommits.forEach(entry => {
        commitHistory.push(entry);
      });
      lastSha = commitHistory[commitHistory.length - 1].commit.sha();
      let walker = this.repo.createRevWalk();
      walker.push(lastSha);
      walker.sorting(Git.Revwalk.SORT.TIME);
      newCommits = await walker.fileHistoryWalk(file, depth);
      return await compileHistory(repo, newCommits, commitHistory, file, depth);
    } catch (err) {
      throw new VError(err, `${logName}`);
    }
  }
  
  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    let masterCommit = await this.repo.getMasterCommit();
    let walker = this.repo.createRevWalk();
    walker.push(masterCommit.sha());
    walker.sorting(Git.Revwalk.SORT.TIME);
    let newCommits = await walker.fileHistoryWalk(fileName, 500);
    let commitHistory = await compileHistory(
      this.repo,
      newCommits,
      [],
      fileName,
      500
    );
    return commitHistory;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get history for ${fileName}`);
  }
};

DbRepository.prototype.fileDiff = async function(commitSha) {
  const logName = `${moduleName}.fileDiff`;

  try {
    if (!this.repo) {
      throw new Error("Repository not initialised");
    }
    let commit = await this.repo.getCommit(commitSha);
    let diffList = await commit.getDiff();
    return diffList;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get file diff`);
  }
};

DbRepository.prototype.init = async function(state, name, url, dbHome) {
  const logName = `${moduleName}.init`;

  try {
    this.name = name;
    this.url = url;
    this.path = path.join(dbHome, name);
    this.repo = await getRepository(this.url, this.path);
    let initialised = await files.isInitialised(this.path);
    if (!initialised) {
      let branchRef = await this.createBranch("setup");
      await this.repo.checkoutBranch(branchRef);
      await files.initialiseRepo(this.path);
      let fileList = await this.repo.getStatus();
      await this.addCommit(fileList, "DBCM Init");
      let mergeSig = Git.Signature.now(state.username(), state.email());
      await this.repo.mergeBranches("master", "setup", mergeSig);
      let remote = await this.repo.getRemote("origin", cloneOptions.fetchOpts);
      await remote.push(
        ["refs/heads/master:refs/heads/master"],
        cloneOptions.fetchOpts
      );
      await this.deleteBranch("setup");
      let tag = await this.addReleaseTag("0.0.1", "Initial release");
      state.setCurrentReleaserTag(tag);
    } else {
      this.pullMaster();
    }
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise ${name}`);
  }
};

/**
 * @async
 *
 * Setup a repository for DBCM. If teh repository has not yet been
 * cloned locally, do the cloning, then open it. If the repository has
 * uncommitted changes, display them. Do a refresh from master into
 * local master by performing a pull
 */
async function setupRepository(state, repoName, repoUrl, repoHome) {
  const logName = `${moduleName}.setupRepository`;

  try {
    let repositories = state.repositories();
    let repo = new DbRepository();
    await repo.init(state, repoName, repoUrl, repoHome);
    repositories.set(repoName, repo);
    state.setRepositories(repositories);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup ${repoName}`);
  }
}

module.exports = {
  statusString,
  DbRepository,
  setupRepository
};
