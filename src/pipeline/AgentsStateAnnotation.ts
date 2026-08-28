import { Annotation } from "@langchain/langgraph";
import { AgentState } from "./types";

const AgentsStateAnnotation = Annotation.Root({
  planner: Annotation<AgentState['planner']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['planner']),
  }),
  uiWorker: Annotation<AgentState['uiWorker']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['uiWorker']),
  }),
  coder: Annotation<AgentState['coder']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['coder']),
  }),
  reviewer: Annotation<AgentState['reviewer']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['reviewer']),
  }),
});

export default AgentsStateAnnotation