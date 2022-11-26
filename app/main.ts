import { app, BrowserWindow, screen, ipcMain, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as settings from 'electron-settings';

const getSetting = async (event, key: string) => {
  const value = await settings.get (key) as string;
  if (!Boolean (value) || !safeStorage.isEncryptionAvailable ()) {
    return value;
  }
  const buff = new Buffer (value, 'base64');
  return safeStorage.decryptString (buff);
};

const setSetting = async (event, key: string, value: string) => {

  if (!Boolean (value)) {
    await settings.set (key, value);
  }

  if (!safeStorage.isEncryptionAvailable ()) {
    await settings.set (key, value);
  }
  const encrypted = safeStorage.encryptString (value);
  const encoded = encrypted.toString ('base64');
  await settings.set (key, encoded);
};

let win: BrowserWindow = null;
const args = process.argv.slice (1),
  serve = args.some (val => val === '--serve');

function createWindow (): BrowserWindow {

  const size = screen.getPrimaryDisplay ().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow ({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      preload: path.join (__dirname, 'preload.ts'),
      allowRunningInsecureContent: ( serve ),
      contextIsolation: true,  // false if you want to run e2e test with Spectron
    },
  });
  win.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });
  if (serve) {
    const debug = require('electron-debug');
    debug();

    require ('electron-reloader') (module);
    win.loadURL ('http://localhost:4200', { userAgent: 'jira-worklog-lol' });
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';
    console.log(__dirname);
    console.log(path.join(__dirname,pathIndex));

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }
    console.log(path.join(__dirname,pathIndex));
    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href,{ userAgent: 'jira-worklog-lol' });
  }


  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  app.whenReady ().then (() => {
    ipcMain.handle ('store:getSetting', getSetting);
    ipcMain.handle ('store:setSetting', setSetting);
    createWindow ();
    app.on ('activate', function () {
      if (BrowserWindow.getAllWindows ().length === 0) createWindow ();
    });
  });

  // Quit when all windows are closed.
  app.on ('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit ();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
// "started": "2022-11-02T12:00:00.000+0530"
// "started": "2022-11-14T03:30:00.000Z"
