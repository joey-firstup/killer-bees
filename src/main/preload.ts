import fs from 'fs';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

function readFlags() {
  const buffer = fs.readFileSync('/opt/socialchorus/workstation/flags.yml');
  return buffer.toString();
}

function writeFlags(yaml: string) {
  fs.writeFileSync('/opt/socialchorus/workstation/flags.yml', yaml);
}

function envValue(name: string) {
  return fs
    .readFileSync('/opt/socialchorus/bossanova/.env.workstation')
    .toString()
    .split('\n')
    .filter((str) => str.indexOf(`${name}=`) >= 0)[0]
    .split('"')[1];
}

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  readFlags,
  writeFlags,
  appId: envValue('CLOUDBEES_APPLICATION_ID'),
  token: envValue('CLOUDBEES_USER_TOKEN'),
});
