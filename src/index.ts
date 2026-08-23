import tools from './agentTools';
import getModel from './model';
import { createDeepAgent, FilesystemBackend } from 'deepagents';
import loadPrompt from './utils/loadPrompt';
import { getSkillsPath, getTargetAQADirPaths } from './utils/paths';
import rag from './RAG/RAG';
import { HumanMessage } from 'langchain';

const agent = createDeepAgent({
  model: getModel(),
  tools: Object.values(tools),
  backend: new FilesystemBackend({ rootDir: process.cwd() }),
  systemPrompt: loadPrompt('system'),
  skills: getSkillsPath(),
});

(async () => {
  await rag.loadRepo(getTargetAQADirPaths());

  const result = await agent.invoke({
    messages: new HumanMessage(
      loadPrompt('invoke', 'ATF PATHS=' + getTargetAQADirPaths().toString())
    ),
  });
})();
