import { Annotation } from '@langchain/langgraph';
import { AgentState } from './types';

const AgentsStateAnnotation = Annotation.Root({
  plannerState: Annotation<AgentState['plannerState']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['plannerState']),
  }),
  uiWorkerState: Annotation<AgentState['uiWorkerState']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['uiWorkerState']),
  }),
  coderState: Annotation<AgentState['coderState']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['coderState']),
  }),
  reviewerState: Annotation<AgentState['reviewerState']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['reviewerState']),
  }),
  planReviewerState: Annotation<AgentState['planReviewerState']>({
    reducer: (x, y) => y ?? x,
    default: () => ({} as AgentState['planReviewerState']),
  }),
});

export default AgentsStateAnnotation;
