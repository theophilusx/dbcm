"use strict";

const moduleName = "GitRepo";

const assert = require("assert");
const VError = require("verror");
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

function GitRepo(name, url, repoPath) {
  const logName = `${moduleName}.GitRepo`;

  try {
    assert.ok(name, "Missing repository name argument");
    assert.ok(url, "Missing repository URL argument");
    assert.ok(repoPath, "Missing local repository path argument");
    this.name = name;
    this.url = url;
    this.path = repoPath;
    this.repoObj = undefined;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create Git repository object`);
  }
}

GitRepo.prototype.getReferenceNames = async function() {
  const logName = `${moduleName}.getReferenceNames`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    return await this.repoObj.getReferenceNames(Git.Reference.TYPE.LISTALL);
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

GitRepo.prototype.branchExists = async function(branchName) {
  const logName = `${moduleName}.branchExists`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    let ref = await Git.Branch.lookup(this.repoObj, branchName, Git.Branch.BRANCH.LOCAL);
    return ref;
  } catch (err) {
    if (err.message.match(/cannot locate local branch/)) {
      return false;
    }
    throw new VError(err, `${logName}`);
  }
};

GitRepo.prototype.checkoutBranch = async function(branchName) {
  const logName = `${moduleName}.checkoutBranch`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    return await this.repoObj.checkoutBranch(branchName);
  } catch (err) {
    throw new VError(err, `${logName} Failed to checkout branch ${branchName}`);
  }
};

GitRepo.prototype.pullMaster = async function() {
  const logName = `${moduleName}.pullMaster`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    await this.repoObj.fetch("origin", cloneOptions.fetchOpts);
    await this.repoObj.mergeBranches("master", "origin/master");
    return true;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

GitRepo.prototype.createBranch = async function(branchName) {
  const logName = `${moduleName}.createBranch`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    let commit = await this.repoObj.getHeadCommit();
    return await this.repoObj.createBranch(branchName, commit, 0);
  } catch (err) {
    throw new VError(err, `${logName} Failed to create branch ${branchName}`);
  }
};

GitRepo.prototype.deleteBranch = async function deleteBranch(branchName) {
  const logName = `${moduleName}.deleteBranch`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
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

GitRepo.prototype.addCommit = async function(files, commitMsg, author, email) {
  const logName = `${moduleName}.addCommit`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
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
    let sig = Git.Signature.now(author, email);
    let commitOid = await this.repoObj.createCommit(
      "HEAD",
      sig,
      sig,
      commitMsg,
      oid,
      [parent]
    );
    return commitOid;
  } catch (err) {
    throw new VError(err, `${logName} Failed to commit files to repository`);
  }
};

GitRepo.prototype.mergeBranches = async function(toBranch, fromBranch, author, email) {
  const logName = `${moduleName}.mergeBranches`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    let sig = Git.Signature.now(author, email);
    await this.repoObj.mergeBranches(toBranch, fromBranch, sig);
    return true;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

GitRepo.prototype.mergeIntoMaster = async function(branch, author, email) {
  const logName = `${moduleName}.mergeIntoMaster`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    await this.checkoutBranch("master");
    await this.pullMaster();
    await this.mergeBranches("master", branch, author, email);
    let remote = await this.repoObj.getRemote("origin", cloneOptions.fetchOpts);
    await remote.push(
      ["refs/heads/master:refs/heads/master"],
      cloneOptions.fetchOpts
    );
    return true;
  } catch (err) {
    throw new VError(err, `${logName} Failed to merge branch into master`);
  }
};

GitRepo.prototype.rebaseBranch = async function(to, from, author, email) {
  const logName = `${moduleName}.rebseBranch`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    let sig = Git.Signature.now(author, email);
    return await this.repoObj.rebaseBranches(to, from, null, sig);
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

GitRepo.prototype.addReleaseTag = async function(name, msg) {
  const logName = `${moduleName}.addReleaseTag`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
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

GitRepo.prototype.getChangeFileSHA = async function(plan) {
  const logName = `${moduleName}.getChangeFileSHA`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
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
    assert.ok(this.repoObj, "Repository not initialised");
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
    assert.ok(this.repoObj, "Repository not initialised");
    let commit = await this.repoObj.getCommit(commitSha);
    let diffList = await commit.getDiff();
    return diffList;
  } catch (err) {
    throw new VError(err, `${logName} Failed to get file diff`);
  }
};

GitRepo.prototype.getStatus = async function() {
  const logName = `${moduleName}.getStatus`;

  try {
    assert.ok(this.repoObj, "Repository not initialised");
    return await this.repoObj.getStatus();
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

GitRepo.prototype.statusString = async function() {
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
    let fileList = await this.getStatus();
    let statusItems = fileList.map(f => statusItem(f));
    return statusItems.join("\n");
  } catch (err) {
    throw new VError(err, `${logName} Failed to generate status string`);
  }
};

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
        this.pullMaster();
        return this.repoObj;
      } catch (err) {
        throw new VError(err, `${logName} Failed to open ${this.path}`);
      }
    }
    throw new VError(err, `${logName} Error cloning repo ${this.url}`);
  }
};

module.exports = GitRepo;

