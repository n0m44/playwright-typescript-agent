import { BaseMessage } from 'langchain';

export type DefaultAgentState = {
  messages: BaseMessage[];
  jsonParseError: boolean;
};

export type AgentState = {
  planner: DefaultAgentState & {
    /**
     * План по которому пойдёт ui worker
     */
    uiWorkerPrompt: string;
  };
  uiWorker: DefaultAgentState & {
    /**
     * Путь по которому нужно пройтись, чтобы написать тест-кейс
     */
    coderUiPath: string;
  };
  planReviewer: DefaultAgentState & {
    /**
     * Замечания для uiWorker'a, если какой-то информаци недостаточно
     */
    uiWorkerFeedback: string;
    /**
     * Approve пути
     */
    isApproved: boolean;
  };
  coder: DefaultAgentState & {
    /**
     * Запрос на сбор дополнительных данных для coder
     */
    uiWorkerRequest: string;
    /**
     * Итерация запроса к uiworker'у, чтобы остановить, если слишком много
     */
    requestIteration: number;
    isRequestSpecify: number;
  };
  reviewer: DefaultAgentState & {
    /**
     * Замечания по ревью
     */
    coderFeedback: string;
    /**
     * Approve теста
     */
    isApproved: boolean;
    /**
     * Итерация ревью, чтобы стопнуть работу, если слишком много попыток было
     */
    reviewIteration: number;
  };
};

export enum AgentsRoles {
  /**
   * Планирует задачу, формирует промпт для ui worker'a. Передает следующему.
   * Сюда нет возврата
   */
  PLANNER = 'planner',
  /**
   * Запускает playwright, собирает данные для написания кейса.
   * Проверяет, можно ли вообще пройтись по переданным шагам.
   */
  UI_WORKER = 'uiworker',
  /**
   * План ревьюер, смотрит, что UI_WORKER прислал всё необходимое, чтобы работать CODER'y
   * Может вернуть на UI_WORKER, если нет соответствия плану!
   */
  PLAN_REVIEWER = 'planreviewer',
  /**
   * Пишет pw test, структуру, если необходимо
   */
  CODER = 'coder',
  /**
   * Ревьюит код
   * Может вернуться назад, если есть замечания!
   */
  REVIEWER = 'reviewer',
}
