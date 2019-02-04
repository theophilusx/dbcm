"use strict";

const moduleName = "ApprovalHistory";

const VError = require("verror");
const Approval = require("./Approval");

function ApprovalHistory({current, history}) {
  const logName = `${moduleName}.ApprovalHistory`;

  try {
    this.current = new Approval(current);
    this.history = history ? history : [];
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

ApprovalHistory.prototype.currentApproval = function() {
  return this.current;
};

ApprovalHistory.prototype.currentApprovalCount = function() {
  return this.current.approvalCount();
};

ApprovalHistory.prototype.addCurrentApproval = function(author, email, sha) {
  return this.current.addApprover(author, email, sha);
};

ApprovalHistory.prototype.currentApprovalState = function() {
  return this.current.approved;
};

ApprovalHistory.prototype.setCurrentApprovalState = function(state, sha, appDate) {
  return this.current.setApprovalState(state, sha, appDate);
};

ApprovalHistory.prototype.currentApprovalSHA = function() {
  return this.current.approvedSha;
};

ApprovalHistory.prototype.setCurrentApprovalSHA = function(sha) {
  return this.current.approvedSha = sha;
};

ApprovalHistory.prototype.resetApproval = function() {
  if (this.current.approvalCount() > 0) {
    this.history.push(this.current);
    this.current = new Approval();
  } else {
    this.current.approved = false;
    this.approvalDate = undefined;
  }
};

ApprovalHistory.prototype.setCurrentReleaseTag = function(tag) {
  return this.current.setReleaseTag(tag);
};

ApprovalHistory.prototype.currentReleaseTag = function() {
  return this.current.releaseTag;
};

ApprovalHistory.prototype.fromObject = function(appHistory) {
  const logName = `${moduleName}.fromObject`;

  try {
    this.current.fromObject(appHistory.current);
    appHistory.history.forEach(app => {
      let newApp = new Approval();
      newApp.fromObject(app);
      this.history.push(newApp);
    });
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

ApprovalHistory.prototype.toObject = function() {
  const logName = `${moduleName}.toObject`;

  try {
    let history = [];
    for (let h of this.history) {
      history.push(h);
    }
    let appHistory = {
      current: this.current,
      history: history
    };
    return appHistory;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
};

module.exports = ApprovalHistory;

