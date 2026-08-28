import { HumanMessage } from "langchain";
import loadPrompt from "../utils/loadPrompt";
import agents from "./agents";
import { AgentState, AgentsRoles } from "./types";
import { PlaneReviewerResultSchema, PlannerResultSchema, UIWorkerResutlSchema } from "./agents.schema";
import { ZodObject } from "zod";

const promptsTemplates = {
  fixTheJSON: 'Верни нормальный JSON без markodwn обёртки и прочего',
  backResultAt: (schema: ZodObject) => `\nРезультат верни в JSON, вот Zod схема для понимания: ${JSON.stringify(schema.toJSONSchema())}`,
  mergePrompts: (...args: string[]) => args.join('\n'),
  fixFeedback: (feedback: string) => `\nПоправь замечания: \n${feedback}`
}

async function runPlanner(state: AgentState) {
  if (state.planner.jsonParseError) {
    state.planner.messages.push(new HumanMessage(promptsTemplates.fixTheJSON))
  } else {
    state.planner.messages.push(new HumanMessage(loadPrompt('invoke', AgentsRoles.PLANNER, promptsTemplates.backResultAt(PlannerResultSchema))));
  }

  const result = await agents.plannerAgent.invoke({ messages: state.planner.messages });
  state.planner.messages = result.messages;
  const lastMsg = result.messages[result.messages.length - 1];
  state.planner.jsonParseError = false;

  const parseResult = PlannerResultSchema.safeParse(lastMsg)
  if (parseResult.error) {
    state.planner.jsonParseError = true;
    return await runPlanner(state);
  }

  state.planner.uiWorkerPrompt = parseResult.data.promptPlan;
  return state;
}

async function runUIWorker(state: AgentState) {
  if (state.uiWorker.jsonParseError) {
    state.uiWorker.messages.push(new HumanMessage(promptsTemplates.fixTheJSON));
  }
  else if (state.planReviewer.uiWorkerFeedback?.length > 1 && !state.planReviewer.isApproved) {
    state.uiWorker.messages.push(new HumanMessage(promptsTemplates.fixFeedback(state.planReviewer.uiWorkerFeedback)));
    state.planReviewer.uiWorkerFeedback = ""
  }
  else {
    state.uiWorker.messages.push(new HumanMessage(loadPrompt('invoke', AgentsRoles.UI_WORKER, promptsTemplates.backResultAt(UIWorkerResutlSchema))));
  }

  const result = await agents.uiWorkerAgent.invoke({ messages: state.uiWorker.messages });
  state.uiWorker.messages = result.messages;
  const lastMsg = result.messages[result.messages.length - 1];
  state.uiWorker.jsonParseError = false;

  const parseResult = UIWorkerResutlSchema.safeParse(lastMsg)
  if (parseResult.error) {
    state.uiWorker.jsonParseError = true;
    return await runUIWorker(state);
  }

  state.uiWorker.coderUiPath = parseResult.data.coderUIPath;
  return state;
}

async function runPlanReviewer(state: AgentState) {
  if (state.planReviewer.jsonParseError) {
    state.planReviewer.messages.push(new HumanMessage(promptsTemplates.fixTheJSON));
  } else {
    state.planReviewer.messages.push(new HumanMessage(loadPrompt('invoke', AgentsRoles.PLAN_REVIEWER, promptsTemplates.backResultAt(PlaneReviewerResultSchema))))
  }

  const result = await agents.planReviewer.invoke({ messages: state.planReviewer.messages });
  state.planReviewer.messages = result.messages;
  const lastMsg = result.messages[result.messages.length - 1];
  state.planReviewer.jsonParseError = false;

  const parseResult = PlaneReviewerResultSchema.safeParse(lastMsg)
  if (parseResult.error) {
    state.planReviewer.jsonParseError = true;
    return await runPlanReviewer(state);
  }

  state.planReviewer.uiWorkerFeedback = parseResult.data.uiWorkerFeedback;
  state.planReviewer.isApproved = parseResult.data.isApproved;
  return state;
}

async function runCoder(state: AgentState) {
  if (state.reviewer.coderFeedback?.length > 1 && !state.reviewer.isApproved) {
    state.coder.messages.push(new HumanMessage(promptsTemplates.fixFeedback(state.reviewer.coderFeedback)));
    state.reviewer.coderFeedback = ""
  } else {
    state.coder.messages.push(new HumanMessage(loadPrompt('invoke', AgentsRoles.CODER, promptsTemplates.backResultAt(PlaneReviewerResultSchema))))
  }

  const result = await agents.coder.invoke({ messages: state.coder.messages });
  state.coder.messages = result.messages;

  return state;
}

function runReviewer(state: AgentState) { }