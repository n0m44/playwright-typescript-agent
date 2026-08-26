import { BaseMessage } from "langchain";

export enum UseLogMessageTypes {
  INFO = 'INFO',
  ERROR = 'ERROR',
  WARN = 'WARN',
}

export type AgentState = {
  executorMessages: BaseMessage[];
  reviewerMessages: BaseMessage[];
  isApproved: boolean;
  feedback: string;
  iteration: number;
  reviewParseError: boolean;
}

export enum NodeNames {
  EXECUTOR = "executor",
  REVIEWER = "reviewer"
}

export type ReviewerResult = {
  approved: boolean;
  feedback: string;
}