"use strict";

const moduleName = "planUI";

const VError = require("verror");
const screen = require("./textScreen");
const menu = require("./textMenus");
const psql = require("../psql");
const selectPlan = require("./selectPlan");

async function applyChangePlan(state, type) {
  const logName = `${moduleName}.applyChangePlan`;
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, type);
    if (menu.doExit(choice)) {
      // no plan selected to act on
      return state;
    }
    let applied = await psql.applyCurrentPlan(state);
    if (applied) {
      await psql.verifyCurrentPlan(state);
    } else {                    // change plan applied with errors
      let changePlan = state.currentPlanDef();
      await psql.rollbackPlan(state, changePlan);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to apply test plan`);
  }
}

async function rollbackChangePlan(state, type) {
  const logName = `${moduleName}.rollbackChangePlan`;
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, type);
    if (menu.doExit(choice)) {
      // no plan selected to act on
      return state;
    }
    let plan = state.currentPlanDef();
    await psql.rollbackPlan(state, plan);
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

async function submitPlanForApproval(state) {
  const logName = `${moduleName}.submitPlanForApproval`;
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, "Development");
    if (menu.doExit(choice)) {
      // no plan selected to act on
      return state;
    }
    let pName = state.currentPlanDef().name;
    screen.infoMsg(
      "Moving Plan to Pending",
      `Moving ${pName} plan to pending group for approval`
    );
    let branch = `${process.env.USER}-local`;
    state.setCurrentPlanType("Pending");
    await state.writeChangePlans();
    await state.currentRepositoryDef().commitAndMerge(
      branch,
      `Submitting plan ${pName} for approval`,
      state.username(),
      state.email()
    );
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to move plan to pending gorup`);
  }
}

module.exports = {
  applyChangePlan,
  rollbackChangePlan,
  submitPlanForApproval  
};
