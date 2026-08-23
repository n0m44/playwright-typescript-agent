import { readFileSync } from 'node:fs';
import path from 'node:path';
import env from './env';

function loadPrompt(promptType: 'system' | 'invoke', supplement?: string) {
  if (!env.PROMPT_INVOKE_RELATIVE || !env.PROMPT_SYSTEM_RELATIVE) {
    throw new Error(
      `Путь до одного из промпта не найден: PROMPT_INVOKE_RELATIVE=${env.PROMPT_INVOKE_RELATIVE} | PROMPT_SYSTEM_RELATIVE=${env.PROMPT_SYSTEM_RELATIVE}`
    );
  }

  let relative = '';
  if (promptType === 'invoke') relative = env.PROMPT_INVOKE_RELATIVE;
  if (promptType === 'system') relative = env.PROMPT_SYSTEM_RELATIVE;

  const prompt = readFileSync(path.join(process.cwd(), path.normalize(relative)), {
    encoding: 'utf-8',
  });

  return prompt + (supplement || '');
}

export default loadPrompt;
