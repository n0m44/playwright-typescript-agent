import path from 'node:path';
import env from './env';

function getSkillsPath(): string[] {
  const paths = env.SKILLS_RELATIVE?.split(',').map((relativePath) => path.normalize(relativePath));

  return paths!;
}

function getTargetAQADirPaths(): string[] {
  if (!env.TARGET_AQA_PATHS.length) {
    throw new Error(`env.TARGET_AQA_PATH пустой: ${env.TARGET_AQA_PATHS}`);
  }
  return env.TARGET_AQA_PATHS.map((p) => path.normalize(p));
}

export { getSkillsPath, getTargetAQADirPaths };
