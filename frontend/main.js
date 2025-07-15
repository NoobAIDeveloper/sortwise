const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, 'build', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'multiSelections'],
  });
  if (canceled) {
    return;
  }
  return filePaths;
});

ipcMain.handle('sort:files', async (event, options) => {
  console.log('Received sort:files request with options:', options);
  return new Promise((resolve, reject) => {
    const backend = path.join(app.getAppPath(), '../dist/sortwise_backend');
    console.log('Spawning backend process:', backend);
    const python = spawn(backend, [JSON.stringify(options)]);

    let stdoutData = '';
    let stderrData = '';

    python.stdout.on('data', (data) => {
      stdoutData += data.toString();
      // For live progress, we would parse here, but we are waiting for close.
    });

    python.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    python.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      if (stderrData) {
        console.warn(`Stderr from Python script: ${stderrData}`);
      }

      if (code === 0) {
        const jsonObjects = stdoutData.trim().split('\n').filter(line => line.startsWith('{'));
        if (jsonObjects.length > 0) {
          try {
            const lastJson = jsonObjects[jsonObjects.length - 1];
            const result = JSON.parse(lastJson);
            if (result.status) {
              console.log('Received final result:', result);
              resolve(result);
            } else {
              const errorMessage = `Python script finished, but the last output was not a status message: ${lastJson}`;
              console.error(errorMessage);
              reject(new Error(errorMessage));
            }
          } catch (e) {
            console.error('Failed to parse final JSON from Python script stdout:', stdoutData);
            reject(new Error(`Failed to parse final JSON from Python script: ${e.message}`));
          }
        } else {
           // If stdout is empty but we have stderr, use that for the error.
          const errorMessage = stderrData.trim() || 'No JSON output from Python script.';
          console.error(errorMessage);
          reject(new Error(errorMessage));
        }
      } else {
        const errorMessage = stderrData.trim() || stdoutData.trim() || `Python script failed with exit code ${code}`;
        console.error(`Python script failed. Stderr: ${stderrData.trim()}`);
        reject(new Error(errorMessage));
      }
    });
  });
});

ipcMain.handle('undo:sort', async (event, logFile) => {
  return new Promise((resolve, reject) => {
    const backend = path.join(app.getAppPath(), '../dist/sortwise_backend');
    const python = spawn(backend, ['undo', logFile]);

    python.stdout.on('data', (data) => {
      resolve(JSON.parse(data.toString()));
    });

    python.stderr.on('data', (data) => {
      reject(JSON.parse(data.toString()));
    });
  });
});
