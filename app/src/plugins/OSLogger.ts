import { registerPlugin } from '@capacitor/core';

export interface OSLoggerPlugin {
  log(options: { message: string }): Promise<{ message: string }>;
}

const OSLogger = registerPlugin<OSLoggerPlugin>('OSLogger');

export default OSLogger;
