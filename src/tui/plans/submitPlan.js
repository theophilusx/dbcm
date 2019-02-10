"use strict";

const VError = require("verror");
const inquirer = require("inquirer");
const screen = require("../utils/textScreen");
const menu = require("../utils/textMenus");
const selectPlan = require("./selectPlan");
const createNote = require("./createNote");

async function updateVersion(plan) {
  const logName = "updateVersion";

  try {
    let question = {
      type: "input",
      name: "versino",
      default: plan.version,
      message: "Release version number"
    };
    let answers = await inquirer.prompt(question);
    if (answers.version !== plan.version) {
      plan.version = answers.version;
    }
    return plan;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

async function submitPlan(state) {
  const logName = "submitPlan";
  let choice;
  
  try {
    [state, choice] = await selectPlan(state, "Development");
    if (choice) {
      let branch = `${process.env.USER}-local`;
      let repo = state.currentRepositoryDef();
      await repo.gitRepo.checkoutBranch(branch);
      let plan = state.planDef(choice);
      plan.textDisplay();
      let doSubmit = await menu.confirmMenu(
        "Submit Plan",
        "Submit this plan for approval"
      );
      if (doSubmit) {
        plan.setType("Pending");
        plan = await updateVersion(plan);
        let doNote = await menu.confirmMenu(
          "Promote Note",
          "Do you want to add a promote note"
        );
        if (doNote) {
          await createNote(state, plan, "Promote Note", "Enter notes for this change");
        }
        await state.writeChangePlans();
        await repo.commitAndMerge(
          branch,
          `Submitting plan ${plan.name} for approval`,
          state.username(),
          state.email()
        );
      } else {
        screen.infoMsg("Cancelled", "Plan approval submission cancelled");
      }
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to move plan to pending gorup`);
  }
}

module.exports = submitPlan;

