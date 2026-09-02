import { END, START, StateGraph } from '@langchain/langgraph';
import AgentsStateAnnotation from './AgentsStateAnnotation';
import { AgentsRoles } from './types';
import runners from './runners';

const workflow = new StateGraph(AgentsStateAnnotation);

workflow
  .addNode(AgentsRoles.PLANNER, runners.runPlanner)
  .addNode(AgentsRoles.UI_WORKER, runners.runUIWorker)
  .addNode(AgentsRoles.PLAN_REVIEWER, runners.runPlanReviewer)
  .addNode(AgentsRoles.CODER, runners.runCoder)
  .addNode(AgentsRoles.REVIEWER, runners.runReviewer)
  .addEdge(START, AgentsRoles.PLANNER)
  .addEdge(AgentsRoles.PLANNER, AgentsRoles.UI_WORKER)
  .addEdge(AgentsRoles.UI_WORKER, AgentsRoles.PLAN_REVIEWER)
  .addConditionalEdges(AgentsRoles.PLAN_REVIEWER, (state) => {
    if (state.planReviewerState.isApproved) {
      return AgentsRoles.CODER;
    }

    return AgentsRoles.UI_WORKER;
  })
  .addEdge(AgentsRoles.CODER, AgentsRoles.REVIEWER)
  .addConditionalEdges(AgentsRoles.REVIEWER, (state) => {
    if (state.reviewerState.isApproved) {
      return END;
    }

    return AgentsRoles.CODER;
  });

export default workflow;