"use strict";

const moduleName = "plans";

const VError = require("verror");
const short = require("short-uuid");
const path = require("path");
const moment = require("moment");
const fse = require("fse");

function createPlansList(plansList) {
  const logName = `${moduleName}.createPlansList`;
  const plans = new Map();

  function toArray() {
    let data = [];
    for (let p of plans.keys()) {
      data.push(plans.get(p));
    }
    return data;
  }
  
  if (Array.isArray(plansList) && plansList.length) {
    for (let p of plansList) {
      plans.set(p.uuid, p);
    }
  }

  return {
    get: id => {
      return plans.get(id);
    },
    set: plan => {
      return plans.set(plan.uuid, plan);
    },
    delete: id => {
      return plans.delete(id);
    },
    setPlanType: (pId, type) => {
      return plans.get(pId).planType = type;
    },
    toArray: toArray,
    createNew: (name, desc, author, email) => {
      let newId = short().new();
      let plan = {
        uuid: newId,
        name: name,
        description: desc,
        createdDate: moment().format("YYYY-MM-DD HH:mm:ss"),
        author: author,
        authorEmail: email,
        planType: "development",
        approved: false,
        approvals: [],
        change: path.join("changes", `${name.replace(/\s+/g, "-")}.sql`),
        verify: path.join("verify", `${name.replace(/\s+/g, "-")}.sql`),
        rollback: path.join("rollback", `${name.replace(/\s+/g, "-")}.sql`)
      };
      plans.set(plan.uuid, plan);
      return plan;
    },
    writeFile: async fileName => {
      try {
        let planObject = {
          name: "Change Plans",
          version: "1.0.0",
          plans: toArray()
        };
        await fse.writeFile(fileName, JSON.stringify(planObject, null, " "));
        return true;
      } catch (err) {
        throw new VError(err, `${logName} Failed to write plans file ${fileName}`);
      }
    },
    initFromFile: async fileName => {
      try {
        plans.clear();
        let jsonData = await fse.readJson(fileName);
        let plansArray = jsonData.plans;
        for (let p of plansArray) {
          plans.set(p.uuid, p);
        }
        return true;
      } catch (err) {
        throw new VError(err, `${logName} Failed to initialize `
                         + `from file ${fileName}`);
      }
    }
  };
}

module.exports = {
  createPlansList
};
