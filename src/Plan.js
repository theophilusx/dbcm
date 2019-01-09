"use strict";

const moduleName = "Plan";

const VError = require("verror");
const moment = require("moment");
const path = require("path");
const short = require("short-uuid");

function Plan(initData) {
  const logName = `${moduleName}.Plan`;

  try {
    if (initData.name && initData.description
        && initData.author && initData.email) {
      this.uuid = initData.uuid ? initData.uuid : short().new();
      this.name = initData.name;
      this.description = initData.description;
      this.createdDate = initData.createdDate ?
        initData.creaedDate : moment().format("YYYY-MM-DD HHm:m:ss");
      this.author = initData.author;
      this.authorEmail = initData.email;
      this.planType = initData.planType ? initData.planType : "Development";
      this.approved = initData.approved ? initData.approved : false;
      this.approvalSha = initData.approvalSha;
      this.approvals = initData.approvals;
      this.change = path.join("change", `${initData.name.replace(/\s+/g, "-")}.sql`);
      this.verify = path.join("verify", `${initData.name.replace(/\s+/g, "-")}.sql`);
      this.rollback = path.join("rollback", `${initData.name.replace(/\s+/g, "-")}.sql`);
    }
    throw new Error("Must provide at least name, description, author and email "
                    + "properties when initialising a new Plan object");
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

Plan.prototype.setType = function(type) {
  const logName = `${moduleName}.setType`;

  try {
    if (type === "Development" || type === "Pending"
        || type === "Approved" || type === "Rejected") {
      this.planType = type;
    }
    throw new Error(`Unknown plan type ${type}`);
  } catch (err) {
    throw new VError(err, `${logName} Failed to set plan type`);
  }
};

module.exports = {
  Plan
};
