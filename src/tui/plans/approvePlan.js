"use strict";

const VError = require("verror");
const selectPlan = require("./selectPlan");
const screen = require("../utils/textScreen");

async function approvePlan(state) {
  const logName = "approvePlan";

  try {
    let repo = state.currentRepositoryDef();
    let branch = `${process.env.USER}-local`;
    if (repo.approvalType !== "none" && !repo.isApprover(state.email())) {
      screen.errorMsg(
        "Not Approved",
        "You are not one of the registered approvers " + "for this repository"
      );
      return state;
    }
    let choice = await selectPlan(state, "Pending");
    if (choice) {
      await repo.gitRepo.checkoutBranch(branch);
      let plan = state.planDef(choice);
      let SHA = await repo.gitRepo.getChangeFileSHA(plan);
      plan.addApproval(state.username(), state.email(), SHA);
      if (
        repo.approvalType === "any" ||
        repo.approvalType === "none" ||
        (repo.approvalType === "all" &&
          repo.approvers.size === plan.currentApprovalCount())
      ) {
        plan.setCurrentApprovalState(true, SHA);
        plan.setType("Approved");
      }
      await state.writeChangePlans();
      await repo.commitAndMerge(
        branch,
        `Approval of plan ${plan.name}`,
        state.username(),
        state.email()
      );
      await repo.gitRepo.checkoutBranch(branch);
    }
    return state;
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

module.exports = approvePlan;
