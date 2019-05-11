"use strict";

const VError = require("verror");
const markPlan = require("./markPlan");

/**
 *
 *
 * @param {AppState} state
 * @returns state
 */
async function markPlanApplied(state) {
  const logName = "markPlanApplied";

  try {
    await markPlan(state, "Applied");
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = markPlanApplied;
