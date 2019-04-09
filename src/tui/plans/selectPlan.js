"use strict";

const VError = require("verror");
const menu = require("../utils/textMenus");
const screen = require("../utils/textScreen");

function emptyGroupWarning() {
  screen.infoMsg(
    "Empty Plan Group",
    "There are currently no plans matching this category"
  );
}

async function selectPlan(state, planMap) {
  const logName = "selectPlan";

  try {
    if (planMap.size === 0) {
      emptyGroupWarning();
      return undefined;
    }
    let planChoices = menu.buildChoices(menu.plansUIList(planMap));
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
