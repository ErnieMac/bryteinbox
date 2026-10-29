const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const { createLocalServer } = require('./local-server.cjs');
const { validateBeeperRequest } = require('./beeper-request.cjs');

const ORIGIN = 'http://127.0.0.1:23374';
let server;
let window;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { window.restore(); window.focus(); } });
  ipcMain.handle('beeper:request', async (event, input) => {
    if (event.sender !== window?.webContents || new URL(event.senderFrame.url).origin !== ORIGIN) throw new Error('Invalid caller');
    const target = validateBeeperRequest(input);
    const response = await fetch(target, {
      method: input.method,
      headers: { Authorization: `Bearer ${input.token}`, 'Content-Type': 'application/json' },
      ...(input.body !== undefined ? { body: input.body } : {}),
      redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  });
  function openWindow() {
    window = new BrowserWindow({ width: 1440, height: 960, minWidth: 360, minHeight: 640, title: 'BryteInbox', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://')) void shell.openExternal(url);
      return { action: 'deny' };
    });
    window.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== ORIGIN) event.preventDefault(); });
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.on('closed', () => { window = undefined; });
    void window.loadURL(`${ORIGIN}/welcome`);
  }
  app.whenReady().then(async () => {
    server = createLocalServer(path.join(__dirname, '..', 'web'));
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(23374, '127.0.0.1', resolve); });
    openWindow();
    app.on('activate', () => { if (!window) openWindow(); });
  }).catch(() => { dialog.showErrorBox('BryteInbox could not start', 'The local app port (23374) may already be in use. Close the other application and try again.'); app.quit(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('will-quit', () => server?.close());
}