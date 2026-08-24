import { readFileSync } from 'node:fs';
import path from 'node:path';
import env from './env';
import { readdir } from 'node:fs/promises';

type PromptType = 'system' | 'invoke';

const prompts: Record<string, { path: string, promptType: PromptType }> = {}

async function scanAllPrompts() {
  if (!env.PROMPTS_RELATIVE) {
    throw new Error(
      `Путь до каталога с промптами не найден: PROMPTS_RELATIVE=${env.PROMPTS_RELATIVE}`
    );
  }

  const promptsFiles = await readdir(path.join(process.cwd(), env.PROMPTS_RELATIVE), { encoding: 'utf-8', withFileTypes: true })

  console.log(path.join(process.cwd(), env.PROMPTS_RELATIVE))
  promptsFiles.forEach((dirent) => {
    const [promptType, role] = dirent.name.substring(0, dirent.name.lastIndexOf('.')).split('_');
    const key = promptType + '_' + role;
    prompts[key] = { path: path.join(dirent.parentPath, dirent.name), promptType: promptType as PromptType }
  })
}

async function loadPrompt(promptType: 'system' | 'invoke', role: string, supplement?: string) {

  const key = promptType + '_' + role;

  if (prompts[key]?.path) {
    return readFileSync(prompts[key].path, { encoding: 'utf-8' }) + `\n${supplement || ''}`
  }

  await scanAllPrompts();

  if (!prompts[key]?.path) {
    throw new Error(`Промпт не найден ${key} среди ${Object.keys(prompts).toString()}`)
  }

  return readFileSync(prompts[key].path, { encoding: 'utf-8' }) + `\n${supplement || ''}`

}

export default loadPrompt;
