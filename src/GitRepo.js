"use strict";

const moduleName = "GitRepo";

const assert = require("assert");
const VError = require("verror");
const path = require("path");
const Git = require("nodegit");

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

function GitRepo(name, url, baseRoot) {
  const logName = `${moduleName}.GitRepo`;

  try {
    assert.ok(
      name && url && baseRoot,
      "Must provide a repository name, url and local path"
    );
    this.name = name;
    this.url = url;
    this.path = path.join(baseRoot, name);
    this.repoObj = undefined;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create Git repository object`);
  }
}

GitRepo.prototype.init = async function() {
  const logName = `${moduleName}.init`;

  try {
    this.repoObj = await Git.Clone(this.url, this.path, cloneOptions);
    return this.repoObj;
  } catch (err) {
    if (err.errno === -4) {
      try {
        // looks like repo already there - try opening and pulling
        this.repoObj = await Git.Repository.open(this.path);
        return this.repoObj;
      } catch (err) {
        throw new VError(err, `${logName} Failed to open ${this.path}`);
      }
    }
    throw new VError(err, `${logName} Error cloning repo ${this.url}`);
  }
};

/**
 * @async
 *
 * Return a list of reference names
 *
 * @return {array} list of reference names
 * 
 */
GitRepo.prototype.getReferenceNames = async function() {
  const logName = `${moduleName}.getReferences`;

  try {
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    let names = await this.repoObj.getReferenceNames(Git.Reference.TYPE.LISTALL);
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
GitRepo.prototype.createBranch = async function(branchName) {
  const logName = `${moduleName}.createBranch`;

  try {
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    let commit = await this.repoObj.getHeadCommit();
    return await this.repoObj.createBranch(branchName, commit, 0);
  } catch (err) {
    throw new VError(err, `${logName} Failed to create branch ${branchName}`);
  }
};

GitRepo.prototype.checkoutBranch = async function(branchName) {
  const logName = `${moduleName}.checkoutBranch`;

  try {
    return await this.repoObj.checkoutBranch(branchName);
  } catch (err) {
    throw new VError(err, `${logName}`);
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
GitRepo.prototype.deleteBranch = async function deleteBranch(branchName) {
  const logName = `${moduleName}.deleteBranch`;

  try {
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    await this.repoObj.checkoutBranch("master");
    let ref = await Git.Branch.lookup(
      this.repoObj,
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
GitRepo.prototype.addCommit = async function(files, commitMsg, author, email) {
  const logName = `${moduleName}.addCommit`;

  try {
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    let index = await this.repoObj.refreshIndex();
    let promises = [];
    files.forEach(f => {
      promises.push(index.addByPath(f.path()));
    });
    await Promise.all(promises);
    await index.write();
    let oid = await index.writeTree();
    let head = await Git.Reference.nameToId(this.repoObj, "HEAD");
    let parent = await this.repoObj.getCommit(head);
    let authorSig = Git.Signature.now(author, email);
    let committerSig = Git.Signature.now(author, email);
    let commitOid = await this.repoObj.createCommit(
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

GitRepo.prototype.mergeIntoMaster = async function(branch, author, email) {
  const logName = `${moduleName}.mergeIntoMaster`;

  try {
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    let mergeSig = Git.Signature.now(author, email);
    await this.repoObj.mergeBranches("master", branch, mergeSig);
    let remote = await this.repoObj.getRemote("origin", cloneOptions.fetchOpts);
    await remote.push(
      ["refs/heads/master:refs/heads/master"],
      cloneOptions.fetchOpts
    );
    await this.deleteBranch(branch);
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to merge branch into master`);
  }
};

GitRepo.prototype.commitAndMerge = async function(branch, msg, author, email) {
  const logName = `${moduleName}.commitAndMerge`;

  try {
    if (!this.repoObj) {
      throw new Error("Git repository not initialised");
    }
    await this.checkoutBranch(branch);
    let fileList = await this.repoObj.getStatus();
    await this.addCommit(fileList, msg, author, email);
    await this.mergeIntoMaster(branch, author, email);
  } catch (err) {
    throw new VError(err, `${logName} Failed to commit and merge branch ${branch}`);
  }
};

GitRepo.prototype.addReleaseTag = async function(name, msg) {
  const logName = `${moduleName}.addReleaseTag`;

  try {
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    let commit = await this.repoObj.getMasterCommit();
    await this.repoObj.createTag(commit.id(), name, msg);
    let remote = await this.repoObj.getRemote("origin", cloneOptions.fetchOpts);
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

GitRepo.prototype.getChangesSha = async function(plan) {
  const logName = `${moduleName}.getChangesSha`;

  try {
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    let commit = await this.repoObj.getHeadCommit();
    let entry = await commit.getEntry(plan.change);
    return entry.sha();
  } catch (err) {
    throw new VError(err, `${logName} Failed to get SHA for changes file `
                     + `${plan.change} in repository`);
  }
};

GitRepo.prototype.fileHistory = async function(fileName) {
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
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    let masterCommit = await this.repoObj.getMasterCommit();
    let walker = this.repoObj.createRevWalk();
    walker.push(masterCommit.sha());
    walker.sorting(Git.Revwalk.SORT.TIME);
    let newCommits = await walker.fileHistoryWalk(fileName, 500);
    let commitHistory = await compileHistory(
      this.repoObj,
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
 
GitRepo.prototype.fileDiff = async function(commitSha) {
  const logName = `${moduleName}.fileDiff`;

  try {
    if (!this.repoObj) {
      throw new Error("Repository not initialised");
    }
    let commit = await this.repoObj.getCommit(commitSha);
    let diffList = await commit.getDiff();
    return diffList;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get file diff`);
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
GitRepo.prototype.statusString = function() {
  const logName = `${moduleName}.statusString`;
  
  function statusItem(s) {
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

  try {
    let fileList = this.repoObj.getStatus();
    let statusItems = fileList.map(f => statusItem(f));
    return statusItems.join("\n");
  } catch (err) {
    throw new VError(err, `${logName} Failed to generate status string`);
  }
};

module.exports = GitRepo;

