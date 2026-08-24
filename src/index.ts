import tools from './agentTools';
import getModel from './model';
import { createDeepAgent, FilesystemBackend } from 'deepagents';
import loadPrompt from './utils/loadPrompt';
import { getSkillsPath, getTargetAQADirPaths } from './utils/paths';
import rag from './RAG/RAG';
import { HumanMessage } from 'langchain';

(async () => {

  const agent = createDeepAgent({
    model: getModel(),
    tools: Object.values(tools),
    backend: new FilesystemBackend({ rootDir: process.cwd() }),
    systemPrompt: '',// await loadPrompt('system', 'executor',),
    skills: getSkillsPath(),
  });


  await rag.loadRepo(getTargetAQADirPaths());

  const result = await agent.invoke({
    messages: new HumanMessage(
      'Используя только RAG расскажи, что ты знаешь о данном тебе репозитории в работу. Например, как создать в CRM событие'// await loadPrompt('invoke', 'executor', 'ATF PATHS=' + getTargetAQADirPaths().toString())
    ),
  });
})();
