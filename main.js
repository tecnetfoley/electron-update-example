// This is free and unencumbered software released into the public domain.
// See LICENSE for details

const {app, BrowserWindow, Menu, protocol, ipcMain, dialog} = require('electron');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
const toml = require('toml');
const fs = require('fs');
const path = require('path');
const ProgressBar = require('electron-progressbar');

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------

// if (isDev) {
// autoUpdater.updateConfigPath = path.join(__dirname, 'app-update.yml');
// }
log.transports.file.level = 'info';
autoUpdater.logger = log;
log.info('App starting...');



// Get settings from toml
const settingsPath = fs.existsSync(path.join(process.resourcesPath, 'settings.toml')) ? path.join(process.resourcesPath, 'settings.toml') : path.join(__dirname, 'settings.toml');
log.info(settingsPath);
const tomlSettings = fs.readFileSync(settingsPath, 'utf8');
log.info(tomlSettings);
const settings = toml.parse(tomlSettings);
log.info(settings);

const updatesUrl = [settings.server.host, settings.server.updatesPath].join('/');
log.info(updatesUrl);
autoUpdater.setFeedURL(updatesUrl);
//-------------------------------------------------------------------
// Define the menu
//
// THIS SECTION IS NOT REQUIRED
//-------------------------------------------------------------------
let template = []
if (process.platform === 'darwin') {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  })
}


//-------------------------------------------------------------------
// Open a window that displays the version
//
// THIS SECTION IS NOT REQUIRED
//
// This isn't required for auto-updates to work, but it's easier
// for the app to show a window than to have to click "About" to see
// that updates are working.
//-------------------------------------------------------------------
let win;

let progressbar;

function sendStatusToWindow(text) {
  log.info(text);
  win.webContents.send('message', text);
}

function updateProgressMessage(text) {
  
}

function createDefaultWindow() {
  win = new BrowserWindow();
  win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });
  win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
  return win;
}

function createProgressWindow() {
  const progressBar = new ProgressBar({
    title: '更新の自動チェック',
    text: '更新の有無を確認しています',
    indeterminate: false,
    detail: '少々お待ちください・・・',
    closeOnComplete: false,
  });
  return progressBar;
}
autoUpdater.on('checking-for-update', () => {
  // sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  progressbar = createProgressWindow();
  progressbar.text = '更新プログラムをダウンロードしています。';
  progressbar.detail = '';
  // sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  if (!progressbar) {

    createDefaultWindow();
    return;
  }
  progressbar.setCompleted();  
  progressbar.detail = 'プログラムが最新です。';
  setTimeout(() => {
    createDefaultWindow();
    progressbar.close();
  }, 1000);

  // sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  if (!progressbar) {
    // Show error dialog
    dialog.showMessageBox({type: 'error', buttons: ['OK'], title:'エラー', message: 'エラーが発生しました', detail:`${err}`});
    createDefaultWindow();
    return;
  }
  progressbar.detail = `エラーが発生しました: ${err}`;
  setTimeout(() => {
    createDefaultWindow();
    progressbar.close();
  }, 5000);
  // sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
 
  const transKb = Math.trunc(progressObj.transferred / 1000);
  const totalKb = Math.trunc(progressObj.total / 1000);
  progressbar.detail = `${transKb}Kb / ${totalKb} Kb`;
  progressbar.value = progressObj.percent;
  // let log_message = "Download speed: " + progressObj.bytesPerSecond;
  // log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  // log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  // sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  progressbar.text = 'ダウンロードが完了しまた。'
  progressbar.detail = '更新プログラムをインストールします。';  
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 1000);
  
});
app.on('ready', function() {
  // Create the Menu
  // const menu = Menu.buildFromTemplate(template);
  // Menu.setApplicationMenu(menu);

  // progressbar = createProgressWindow();
  // progressbar.on('ready', () => {
  //   autoUpdater.checkForUpdates();
  // });

  autoUpdater.checkForUpdates();
  
});
app.on('window-all-closed', () => {
  log.info('window-all-closed');
  app.quit();
});

//
// CHOOSE one of the following options for Auto updates
//

//-------------------------------------------------------------------
// Auto updates - Option 1 - Simplest version
//
// This will immediately download an update, then install when the
// app quits.
//-------------------------------------------------------------------
// app.on('ready', function()  {
//   autoUpdater.checkForUpdatesAndNotify();
// });

//-------------------------------------------------------------------
// Auto updates - Option 2 - More control
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
app.on('ready', function()  {
  
});
// autoUpdater.on('checking-for-update', () => {
// })
// autoUpdater.on('update-available', (info) => {
// })
// autoUpdater.on('update-not-available', (info) => {
// })
// autoUpdater.on('error', (err) => {

// })
// autoUpdater.on('download-progress', (progressObj) => {
// })
// autoUpdater.on('update-downloaded', (info) => {
//   autoUpdater.quitAndInstall();  
// })
