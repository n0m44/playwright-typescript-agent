import tools from './agentTools';
import getModel from './model';
import { createDeepAgent, FilesystemBackend } from 'deepagents';
import loadPrompt from './utils/loadPrompt';
import { getSkillsPath, getTargetAQADirPaths } from './utils/paths';
import rag from './RAG/RAG';
import { HumanMessage } from 'langchain';
import { END, START, StateGraph } from '@langchain/langgraph';
import { AgentState, NodeNames, ReviewerResult } from './agentTools/types';
import { AgentStateAnnotation } from './agentTools/state.schema';
import logger from './utils/logger';


const executorAgent = createDeepAgent({
  model: getModel(),
  tools: Object.values(tools),
  backend: new FilesystemBackend({ rootDir: process.cwd() }),
  systemPrompt: loadPrompt('system', NodeNames.EXECUTOR),
  skills: getSkillsPath(),
});

const reviewerAgent = createDeepAgent({
  model: getModel(),
  tools: Object.values(tools),
  backend: new FilesystemBackend({ rootDir: process.cwd() }),
  systemPrompt: loadPrompt('system', NodeNames.REVIEWER),
  skills: getSkillsPath(),
});

async function runExecutor(state: AgentState) {
  if (state.feedback.length <= 1) {
    logger.info(`Начинаем работать`)
    state.executorMessages.push(new HumanMessage(
      await loadPrompt('invoke', NodeNames.EXECUTOR, 'ATF PATHS=' + getTargetAQADirPaths().toString())
    ),
    );
  }
  else {
    logger.info(`[AFTER REVIEW] Просим поправить замечания из фидбека: ${state.feedback}`);
    state.executorMessages.push(new HumanMessage(`Поправь замечания по правкам от ревьюера: ${state.feedback}`));

  }

  const result = await executorAgent.invoke({
    messages: state.executorMessages
  })
  state.executorMessages = result.messages;
  state.feedback = "";
  state.isApproved = false;
  state.iteration += 1;
  return state;
}

async function runReviewer(state: AgentState) {
  if (state.reviewParseError) {
    logger.info(`Агент вернул кривой JSON, просим вернуть нормальный. Итерация ревью= #${state.iteration}`)
    state.reviewerMessages.push(new HumanMessage('Ты сформировал кривой JSON. Возможно добавил markdown вне JSON. Поправь и верни чистый JSON'))
  } else {
    logger.info(`Начинаем Ревью. Итерация #${state.iteration}`)
    state.reviewerMessages.push(new HumanMessage(`Новая итерация # ${state.iteration}. Путь до репозитория, где нужно провести ревью ${getTargetAQADirPaths().toString()}`))
  }

  const result = await reviewerAgent.invoke({ messages: state.reviewerMessages })
  state.reviewerMessages = result.messages;
  state.reviewParseError = false;

  try {
    const lastMessageParsed = JSON.parse(result.messages[result.messages.length - 1]!.content as string) as ReviewerResult;
    state.isApproved = lastMessageParsed.approved;
    state.feedback = lastMessageParsed.feedback;
  } catch (e) {
    state.reviewParseError = true;
    logger.error(`AI не смогла вернуть нормальный JSON. Вместо этого ${result.messages[result.messages.length - 1]!.content}`)
    return await runReviewer(state);
  }

  return state;
}

(async () => {

  const workflow = new StateGraph(AgentStateAnnotation);
  workflow.addNode(NodeNames.EXECUTOR, runExecutor)
    .addNode(NodeNames.REVIEWER, runReviewer)
    .addEdge(START, NodeNames.EXECUTOR)
    .addEdge(NodeNames.EXECUTOR, NodeNames.REVIEWER)
    .addConditionalEdges(NodeNames.REVIEWER, (state) => {
      return state.isApproved || state.iteration > 3 ? END : NodeNames.EXECUTOR
    }, {
      [NodeNames.EXECUTOR]: NodeNames.EXECUTOR,
      [END]: END
    });

  const app = workflow.compile();

  const initialState: AgentState = {
    executorMessages: [],
    reviewerMessages: [],
    feedback: "",
    isApproved: false,
    iteration: 0,
    reviewParseError: false,
  }

  await rag.loadRepo(getTargetAQADirPaths());

  await app.invoke(initialState);
})();
