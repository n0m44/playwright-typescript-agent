import { HumanMessage } from 'langchain';
import loadPrompt from '../utils/loadPrompt';
import agents from './agents';
import { AgentState, AgentsRoles } from './types';
import {
  PlaneReviewerResultSchema,
  PlannerResultSchema,
  ReviewerResultSchema,
  UIWorkerResutlSchema,
} from './agents.schema';
import { ZodObject } from 'zod';
import logger from '../utils/logger';
import { getTargetAQADirPaths } from '../utils/paths';

const promptsTemplates = {
  fixTheJSON: 'В JSON есть ошибки, обнаружишь их и верни валидный JSON со всеми правилами',
  backResultAt: (schema: ZodObject) =>
    `
      Твой ответ должен содержать **исключительно** валидный JSON-объект, без markdown-разметки, без пояснений, без лишних пробелов и переносов строк. 
      Не используй ничего лишнего, что не входит в JSON-разметку. Не используй опасные значения в виде регулярных символов и прочего
      Вот Zod-схема для справки (она показывает ожидаемую структуру, но не отменяет требования экранирования):
      ${JSON.stringify(schema.toJSONSchema())}
      `,
  mergePrompts: (...args: string[]) => args.join('\n'),
  fixFeedback: (feedback: string) => `\nПоправь замечания: \n${feedback}`,
  iteration: (count: number) => `Итерация ${count}`
};

async function runPlanner(state: AgentState) {
  if (state.plannerState.jsonParseError) {
    logger.info('[runPlanner] Ошибка парсинга JSON, пытаемся вразумить')
    state.plannerState.messages.push(new HumanMessage(promptsTemplates.fixTheJSON));
  } else {
    logger.info('[runPlanner] Начинаем задачу по тест-кейсу')
    state.plannerState.messages.push(
      new HumanMessage(
        loadPrompt(
          'invoke',
          AgentsRoles.PLANNER,
          promptsTemplates.backResultAt(PlannerResultSchema)
        )
      )
    );
  }

  const result = await agents.planner.invoke({ messages: state.plannerState.messages });
  state.plannerState.messages = result.messages;
  const lastMsg = result.messages[result.messages.length - 1];
  state.plannerState.jsonParseError = false;

  try {
    const parseResult = PlannerResultSchema.safeParse(JSON.parse(`${lastMsg?.content}`.replaceAll('\n', '')));
    if (parseResult.error) {
      state.plannerState.jsonParseError = true;

      return await runPlanner(state);
    }

    state.plannerState.uiWorkerPrompt = parseResult.data.promptPlan;
    return state;
  } catch (error) {
    logger.info(`[runPlanner] Ошибка парсинга JSON, что прислал: ${lastMsg?.content}`)
    state.plannerState.jsonParseError = true;
    return await runPlanner(state);
  }
}

async function runUIWorker(state: AgentState) {
  if (state.uiWorkerState.jsonParseError) {
    logger.info(`[runUIWorker] Ошибка парсинга JSON, пытаемся вразумить`)
    state.uiWorkerState.messages.push(new HumanMessage(promptsTemplates.fixTheJSON));
  }
  // Пока не трогаем, мб и не нужно это
  // else if (state.coder.uiWorkerRequest.length > 1) {
  // }
  if (state.planReviewerState.uiWorkerFeedback?.length > 1 && !state.planReviewerState.isApproved) {
    logger.info(`[runUIWorker] Работаем над замечаниям \n${state.planReviewerState.uiWorkerFeedback}`)
    state.uiWorkerState.messages.push(
      new HumanMessage(promptsTemplates.fixFeedback(state.planReviewerState.uiWorkerFeedback))
    );
    state.planReviewerState.uiWorkerFeedback = '';
  } else {
    logger.info(`[runUIWorker] Начинаем работу по промпту: ${state.plannerState.uiWorkerPrompt}`)
    state.uiWorkerState.messages.push(
      new HumanMessage(
        state.plannerState.uiWorkerPrompt + "\n" +
        promptsTemplates.backResultAt(UIWorkerResutlSchema)
      )
    );
  }

  const result = await agents.uiWorker.invoke({ messages: state.uiWorkerState.messages });
  state.uiWorkerState.messages = result.messages;
  const lastMsg = result.messages[result.messages.length - 1];
  state.uiWorkerState.jsonParseError = false;

  try {
    const parseResult = UIWorkerResutlSchema.safeParse(JSON.parse(`${lastMsg?.content}`.replaceAll('\n', '')));
    if (parseResult.error) {
      state.uiWorkerState.jsonParseError = true;

      return await runUIWorker(state);
    }

    state.uiWorkerState.coderUiPath = parseResult.data.coderUIPath;
    return state;
  } catch (error) {
    logger.info(`[runUIWorker] Ошибка парсинга JSON, что прислал: ${lastMsg?.content}`)
    state.uiWorkerState.jsonParseError = true;
    return await runUIWorker(state);
  }

}

async function runPlanReviewer(state: AgentState) {
  if (state.planReviewerState.jsonParseError) {
    logger.info(`[runPlanReviewer] Ошибка парсинга JSON, пытаемся вразумить`)
    state.planReviewerState.messages.push(new HumanMessage(promptsTemplates.fixTheJSON));
  } else {
    logger.info(`[runPlanReviewer] Начинаем работу по UI путю: \n${state.uiWorkerState.coderUiPath}`)
    state.planReviewerState.messages.push(
      new HumanMessage(
        state.uiWorkerState.coderUiPath + "\n" +
        promptsTemplates.backResultAt(PlaneReviewerResultSchema)
      )
    );
  }

  const result = await agents.planReviewer.invoke({ messages: state.planReviewerState.messages });
  state.planReviewerState.messages = result.messages;
  const lastMsg = result.messages[result.messages.length - 1];
  state.planReviewerState.jsonParseError = false;

  try {
    const parseResult = PlaneReviewerResultSchema.safeParse(JSON.parse(`${lastMsg?.content}`.replaceAll('\n', '')));
    if (parseResult.error) {
      state.planReviewerState.jsonParseError = true;

      return await runUIWorker(state);
    }

    state.planReviewerState.isApproved = parseResult.data.isApproved;
    state.planReviewerState.uiWorkerFeedback = parseResult.data.uiWorkerFeedback;
    return state;
  } catch (error) {
    logger.info(`[runPlanReviewer] Ошибка парсинга JSON, что прислал: ${lastMsg?.content}`)
    state.planReviewerState.jsonParseError = true;
    return await runPlanReviewer(state);
  }

}

async function runCoder(state: AgentState) {
  if (state.reviewerState.coderFeedback?.length > 1 && !state.reviewerState.isApproved) {
    logger.info(`[runCoder] Начинаем работу над замечаниями: ${state.reviewerState.coderFeedback}`)
    state.coderState.messages.push(
      new HumanMessage(promptsTemplates.fixFeedback(state.reviewerState.coderFeedback))
    );
    state.reviewerState.coderFeedback = '';
  } else {
    logger.info(`[runCoder] Отрабатываем по ui-path: \n${state.uiWorkerState.coderUiPath}`)
    state.coderState.messages.push(
      new HumanMessage(
        state.plannerState.uiWorkerPrompt + "\n"
        + state.uiWorkerState.coderUiPath
        + "\nРабочие каталоги" + getTargetAQADirPaths()
      )
    );
  }

  const result = await agents.coder.invoke({ messages: state.coderState.messages });
  state.coderState.messages = result.messages;

  return state;
}

async function runReviewer(state: AgentState) {
  if (state.reviewerState.jsonParseError) {
    logger.info(`[runReviewer] Ошибка парсинга JSON, пытаемся вразумить`)
    state.reviewerState.messages.push(new HumanMessage(promptsTemplates.fixTheJSON));
  }
  else if (state.reviewerState.reviewIteration > 1) {
    logger.info(`[runReviewer] Итерация #${state.reviewerState.reviewIteration}`)
    state.reviewerState.messages.push(new HumanMessage(promptsTemplates.iteration(++state.reviewerState.reviewIteration)))
  } else {
    state.reviewerState.messages.push(
      new HumanMessage(
        promptsTemplates.iteration(++state.reviewerState.reviewIteration) + "\n"
        + state.plannerState.uiWorkerPrompt + "\n"
        + state.uiWorkerState.coderUiPath + "\n"
        + promptsTemplates.backResultAt(ReviewerResultSchema)
        + "\nРабочие каталоги" + getTargetAQADirPaths()
      )
    );
  }

  const result = await agents.reviewer.invoke({ messages: state.reviewerState.messages });
  state.reviewerState.messages = result.messages;
  const lastMsg = result.messages[result.messages.length - 1];
  state.reviewerState.jsonParseError = false;

  try {
    const parseResult = ReviewerResultSchema.safeParse(JSON.parse(`${lastMsg?.content}`.replaceAll('\n', '')));
    if (parseResult.error) {
      state.reviewerState.jsonParseError = true;

      return await runUIWorker(state);
    }

    state.reviewerState.coderFeedback = parseResult.data.coderFeedback;
    state.reviewerState.isApproved = parseResult.data.isApproved;
    return state;
  } catch (error) {
    logger.info(`[reviewerState] Ошибка парсинга JSON, что прислал: ${lastMsg?.content}`)
    state.reviewerState.jsonParseError = true;
    return await runReviewer(state);
  }
}

const runners = {
  runPlanner,
  runPlanReviewer,
  runCoder,
  runUIWorker,
  runReviewer,
};

export default runners;
