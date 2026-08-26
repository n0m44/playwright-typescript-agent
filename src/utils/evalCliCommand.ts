import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger';

const execAsync = promisify(exec);

function evalCommand(command: string, timeout: number) {
  return execAsync(command, {
    timeout,
  })
    .then(({ stdout, stderr }) => {
      let result = '';
      if (stdout) result += stdout;
      if (stderr) result += (result ? '\n' : '') + '[stderr] ' + stderr;
      logger.info(`Result of \`${command}\`: ${result}`);
      return result || 'Command executed successfully (no output)';
    })
    .catch((error: any) => {
      let errorMessage = `Command failed: ${error.message}`;
      if (error.stdout) errorMessage += `\nstdout: ${error.stdout}`;
      if (error.stderr) errorMessage += `\nstderr: ${error.stderr}`;
      logger.error(`Error of \`${command}\`: ${error}`);
      return errorMessage;
    });
}

export default async function evalCliCommand(command: string, timeout: number) {
  logger.debug(`Evaluate: ${command}`);
  try {
    const result = await evalCommand(command, timeout);
    return result;
  } catch (error: any) {
    logger.debug(`Поймали синхронную ошибку, при выполнении: ${command}`);
    let errorMessage = `Command failed: ${error.message}`;
    if (error.stdout) errorMessage += `\nstdout: ${error.stdout}`;
    if (error.stderr) errorMessage += `\nstderr: ${error.stderr}`;
    logger.error(`Error of \`${command}\`: ${error}`);
    return errorMessage;
  }

}
