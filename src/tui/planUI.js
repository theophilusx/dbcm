"use strict";

const moduleName = "planUI";

const VError = require("verror");
const inquirer = require("inquirer");
const screen = require("./textScreen");
const menu = require("./textMenus");
const Plan = require("../Plan");
const psql = require("../psql");
const path = require("path");
const edit = require("../edit");

function commitWarning() {
  let title = "Uncommitted Changes";
  let msg = `
Cannot create a new plan or switch to a different plan when uncommitted plan data
exists. Either commit the changes or revert the changes before attempting to create
a new plan or switch to an alternative plan
`;
  screen.warningMsg(title, msg);
}

function emptyGroupWarning(type) {
  screen.infoMsg(
    "Empty Plan Group",
    `There are currently no plans defined in the ${type} group for this repository`
  );
}

async function createPlan(state) {
  const logName = `${moduleName}.createPlan`;
  const questions = [
    {
      type: "input",
      name: "name",
      message: "Plan name:"
    },
    {
      type: "input",
      name: "description",
      message: "Description:"
    }];

  try {
    let answers = await inquirer.prompt(questions);
    let changePlan = new Plan({
      name: answers.name,
      description: answers.description,
      author: state.username(),
      email: state.email()
    });
    changePlan.textDisplay();
    answers = await inquirer.prompt([{
      type: "confirm",
      name: "createPlan",
      message: "Create this change record:"
    }]);
    if (answers.createPlan) {
      await state.addChangePlan(changePlan);
      state.setCurrentPlanUUID(changePlan.uuid);
      await state.writeChangePlans();
    } else {
      screen.infoMsg("Cancelled", "Plan creation cancelled");
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to create new change plan`);
  }
}

async function listPlans(state, type) {
  const logName = `${moduleName}.listPlans`;

  try {
    if (state.changePlans().count(type) === 0) {
      emptyGroupWarning(type);
      return state;
    }
    let planChoices = menu.buildChoices(state.changePlans().plansUIList(type));
    let choice;
    do {
      choice = await menu.listMenu(
        state,
        "Change Plans",
        "Select Plan:",
        planChoices
      );
      if (!menu.doExit(choice)) {
        state.planDef(choice).textDisplay();
      }
    } while (!menu.doExit(choice));
    state.setMenuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to display list menu`);
  }
}

async function selectPlan(state, type) {
  const logName = `${moduleName}.selectPlan`;

  try {
    if (state.changePlans().count(type) === 0) {
      emptyGroupWarning(type);
      return [state, undefined];
    }
    let planChoices = menu.buildChoices(state.changePlans().plansUIList(type));
    let choice = await menu.listMenu(
      state,
      "Change Plans",
      "Select Plan:",
      planChoices
    );
    if (menu.doExit(choice)) {
      return [state. undefined];
    }
    if (choice !== state.currentPlanUUID()) {
      state.setCurrentPlanUUID(choice);
    }
    return [state, choice];
  } catch (err) {
    throw new VError(err, `${logName} Error selecting change set`);
  }
}

async function editPlan(state) {
  const logName = `${moduleName}.editPlan`;
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, "Development");
    if (!menu.doExit(choice)) {
      let plan = state.currentPlanDef();
      let files = [
        path.join(state.home(), state.currentRepositoryName(), plan.change),
        path.join(state.home(), state.currentRepositoryName(), plan.verify),
        path.join(state.home(), state.currentRepositoryName(), plan.rollback)
      ];
      edit.editFiles(files);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

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
  createPlan,
  listPlans,
  selectPlan,
  editPlan,
  applyChangePlan,
  rollbackChangePlan,
  submitPlanForApproval  
};
