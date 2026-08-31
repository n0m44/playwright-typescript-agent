import workflow from "./pipeline";
import { AgentState } from "./pipeline/types";
import rag from "./RAG";
import { getTargetAQADirPaths } from "./utils/paths";



(async () => {

  const initialState: AgentState = {
    coderState: {
      requestIteration: 0,
      jsonParseError: false,
      messages: []
    },
    plannerState: {
      uiWorkerPrompt: "",
      jsonParseError: false,
      messages: [],
    },
    uiWorkerState: {
      coderUiPath: "",
      jsonParseError: false,
      messages: [],
    },
    planReviewerState: {
      isApproved: false,
      uiWorkerFeedback: "",
      jsonParseError: false,
      messages: [],
    },
    reviewerState: {
      coderFeedback: "",
      isApproved: false,
      reviewIteration: 1,
      jsonParseError: false,
      messages: []
    }
  }

  await rag.loadRepo(getTargetAQADirPaths());

  const app = workflow.compile();

  await app.invoke(initialState);
})();
