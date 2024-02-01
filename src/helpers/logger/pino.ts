import {pino} from 'pino';

export const Logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      ignore: 'pid,hostname', // --ignore
      singleLine: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l Z',
    },
  },
});
