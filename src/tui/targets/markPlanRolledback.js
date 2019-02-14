"use strict";

const VError = require("verror");
const markPlan = require("./markPlan");

async function markPlanRolledback(state) {
  const logName = "markPlanApplied";

  try {
    await markPlan(state, "Rolledback");
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = markPlanRolledback;
