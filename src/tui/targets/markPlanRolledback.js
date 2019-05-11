"use strict";

const VError = require("verror");
const markPlan = require("./markPlan");

/**
 * Marks a plan as having been applied in current database target
 *
 * @param {AppState} state
 * @returns state
 */
async function markPlanRolledback(state) {
  const logName = "markPlanRolledback";

  try {
    await markPlan(state, "Rolledback");
    return state;
  } catch (err) {
    throw new VError(err, logName);
  }
}

module.exports = markPlanRolledback;
