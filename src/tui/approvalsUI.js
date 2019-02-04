"use strict";

const moduleName = "approvalsUI";

const VError = require("verror");
const menu = require("./textMenus");
const screen = require("./textScreen");
const planui = require("./planUI");
const path = require("path");
const edit = require("../edit");
const gitui = require("./gitUI");
const rejectui = require("./rejectUI");

const actionChoices = menu.buildChoices([
  ["Review Plan Source", "viewPlan"],
  ["View Plan Diff", "comparePlan"],
  ["Approve Plan", "approvePlan"],
  ["Reject Plan", "rejectPlan"]
]);

function approvalActions(state) {
  const logName = `${moduleName}.approvalActions`;

  return async answer => {
    try {
      state.setMenuChoice(answer.choice);
      if (menu.doExit(answer.choice)) {
        return state;
      }
      switch (answer.choice) {
      case "viewPlan": {
        let choice = "";
        [state, choice] = await planui.selectPlan(state, "Pending");
        if (menu.doExit(choice)) {
          return state;
        }
        let planDef = state.currentPlanDef();
        let fileList = [
          path.join(state.home(), state.currentRepositoryName(), planDef.change),
          path.join(state.home(), state.currentRepositoryName(), planDef.verify),
          path.join(state.home(), state.currentRepositoryName(), planDef.rollback)
        ];
        edit.viewFiles(fileList);
        break;
      }
      case "comparePlan": {
        let planId;
        [state, planId] = await planui.selectPlan(state, "Pending");
        if (menu.doExit(planId)) {
          return state;
        }
        let planDef = state.currentPlanDef();
        let history =
            await state.currentRepositoryDef().gitRepo.fileHistory(planDef.change);
        gitui.displayCommitHistory(history);
        let diffList = await state.currentRepositoryDef().gitRepo.fileDiff(
          history[0].commit.sha()
        );
        await gitui.displayDiff(diffList);
        break;
      }
      case "approvePlan": {
        let repo = state.currentRepositoryDef();
        let branch = `${process.env.USER}-local`;
        await repo.gitRepo.checkoutBranch(branch);
        let choice;
        [state, choice] = await planui.selectPlan(state, "Pending");
        if (menu.doExit(choice)) {
          return state;
        }
        if (!repo.isApprover(state.email())) {
          screen.errorMsg(
            "Not Approved",
            "You are not one of the registered approvers "
              + "for this repository"
          );
          return state;
        }
        let planDef = state.currentPlanDef();
        let SHA = await repo.gitRepo.getChangeFileSHA(planDef);
        planDef.addApproval(state.username(), state.email(), SHA);
        if (repo.approvalType === "any"
            || (repo.approvalType === "all"
                && repo.approvers.size === planDef.currentApprovalCount())) {
          planDef.setCurrentApprovalState(true, SHA);
          planDef.setType("Approved");
        }
        await state.writeChangePlans();
        await repo.commitAndMerge(
          branch,
          `Approval of plan ${planDef.name}`,
          state.username(),
          state.email()
        );
        return state;
      }
      case "rejectPlan":
        state = rejectui.rejectPlan(state);
        break;
      default:
        screen.errorMsg(
          "Unrecognised Action",
          `${logName}: No associated action for choice ${answer.choice}`
        );
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName} Failure in processing menu action`);
    }
  };
}

async function processPlanApproval(state) {
  const logName = `${moduleName}.processPlanApproval`;
  
  try {
    do {
      state = await menu.listMenu(
        state,
        "Plan Approval Menu",
        "Select approval action:",
        actionChoices,
        approvalActions(state)
      );
    } while (!menu.doExit(state.menuChoice()));
    state.menuChoice("");
    return state;
  } catch (err) {
    throw new VError(err, `${logName} Failed to process plan approval`);
  }
}

// async function selectApprovalType(state) {
//   const logName = `${moduleName}.selectApprovalType`;
//   const choices = [{
//     name: "No approvals required",
//     value: "none"
//   },
//   {
//     name: "Any single registered approver can approve a change",
//     value: "any"
//   },
//   {
//     name: "All registered approvers must approve the change",
//     value: "all"
//   }];
  
//   try {
//     console.log(`Current Approval Type: ${state.approvalType()}`);
//     let choice = await menu.listMenu(
//       state,
//       "Approval Type",
//       "Select approval type:",
//       choices
//     );
//     state.setApprovalType(choice);
//     return state;
//   } catch (err) {
//     throw new VError(err, `${logName} `);
//   }
// }

// async function selectApprovers(state) {
//   const logName = `${moduleName}.selectApprovers`;

//   try {
//     let choices = [];
//     let approvers = state.approvers();
//     for (let a of approvers.keys()) {
//       choices.push({
//         name: `${approvers.get(a)} <${a}>`,
//         value: a
//       });
//     }
//     let question1 = [{
//       type: "checkbox",
//       name: "toKeep",
//       choices: choices,
//       message: "Select approvers to keep:"
//     }];
//     let question2 = [{
//       type: "confirm",
//       name: "addMore",
//       message: "Do you want to add another approver:"
//     },
//     {
//       type: "input",
//       name: "name",
//       message: "Approver's name:",
//       when: answer => {
//         return answer.addMore;
//       }
//     },
//     {
//       type: "input",
//       name: "email",
//       message: "Approver's email address:",
//       when: answer => {
//         return answer.addMore;
//       }
//     }];
//     let newApprovers = new Map();
//     if (approvers.size > 0) {
//       let answer = await inquirer.prompt(question1);
//       for (let a of answer.toKeep) {
//         newApprovers.set(a, approvers.get(a));
//       }
//     }
//     let answer;
//     do {
//       answer = await inquirer.prompt(question2);
//       if (answer.addMore) {
//         newApprovers.set(answer.email, answer.name);
//       }
//     } while (answer.addMore);
//     state.setApprovers(newApprovers);
//     return state;
//   } catch (err) {
//     throw new VError(err, `${logName} `);
//   }
// }

// async function editApprovalSettings(state) {
//   const logName = `${moduleName}.editApprovals`;

//   try {
//     let committed = await gitui.commitChanges(state);
//     if (committed) {
//       let repo = state.get("repoObject");
//       await git.createBranch(repo, "approvals");
//       await repo.checkoutBranch("approvals");
//       state = await selectApprovalType(state);
//       state = await selectApprovers(state);
//       await approvals.writeApprovalsFile(state);
//       let changeFiles = await repo.getStatus();
//       if (changeFiles.length) {
//         let commitMsg = "Updating repository approval settings";
//         await git.addAndCommit(state, changeFiles, commitMsg);
//         await git.pullMaster(repo);
//         await git.mergeBranchIntoMaster(state, "approvals");
//       } else {
//         await git.deleteBranch(repo, "approvals");
//       }
//       return state;
//     }
//   } catch (err) {
//     throw new VError(err, `${logName} `);
//   }
// }

module.exports = {
  processPlanApproval,
};

