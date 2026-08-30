import { createDeepAgent, FilesystemBackend } from 'deepagents';
import getModel from '../model';
import tools from '../agentTools';
import loadPrompt from '../utils/loadPrompt';
import { getSkillsPath } from '../utils/paths';
import { AgentsRoles } from './types';

const planner = createDeepAgent({
  model: getModel(),
  tools: Object.values(tools),
  backend: new FilesystemBackend({ rootDir: process.cwd() }),
  systemPrompt: loadPrompt('system', AgentsRoles.PLANNER),
  skills: getSkillsPath(),
});

const uiWorker = createDeepAgent({
  model: getModel(),
  tools: Object.values(tools),
  backend: new FilesystemBackend({ rootDir: process.cwd() }),
  systemPrompt: loadPrompt('system', AgentsRoles.UI_WORKER),
  skills: getSkillsPath(),
});

const planReviewer = createDeepAgent({
  model: getModel(),
  tools: Object.values(tools),
  backend: new FilesystemBackend({ rootDir: process.cwd() }),
  systemPrompt: loadPrompt('system', AgentsRoles.PLAN_REVIEWER),
  skills: getSkillsPath(),
});

const coder = createDeepAgent({
  model: getModel(),
  tools: Object.values(tools),
  backend: new FilesystemBackend({ rootDir: process.cwd() }),
  systemPrompt: loadPrompt('system', AgentsRoles.CODER),
  skills: getSkillsPath(),
});

const reviewer = createDeepAgent({
  model: getModel(),
  tools: Object.values(tools),
  backend: new FilesystemBackend({ rootDir: process.cwd() }),
  systemPrompt: loadPrompt('system', AgentsRoles.REVIEWER),
  skills: getSkillsPath(),
});

const agents = {
  planner,
  uiWorker,
  coder,
  reviewer,
  planReviewer,
};

export default agents;
