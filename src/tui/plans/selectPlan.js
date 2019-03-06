"use strict";

const VError = require("verror");
const menu = require("../utils/textMenus");
const screen = require("../utils/textScreen");

function emptyGroupWarning(type) {
  screen.infoMsg(
    "Empty Plan Group",
    `There are currently no plans defined in the ${type} group for this repository`
  );
}

async function selectPlan(state, group) {
  const logName = "selectPlan";

  try {
    if (state.changePlans().count(group) === 0) {
      emptyGroupWarning(group);
      return undefined;
    }
    let planChoices = menu.buildChoices(state.changePlans().plansUIList(group));
    let choice = await menu.listMenu(
      state,
      "Change Plans",
      "Select Plan:",
      planChoices
    );
    if (menu.doExit(choice)) {
      return undefined;
    }
    return choice;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = selectPlan;
