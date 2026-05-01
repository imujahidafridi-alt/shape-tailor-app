import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const activePrintWindows = new Set<BrowserWindow>();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    const isDevRun = !app.isPackaged || process.env.NODE_ENV === 'development' || process.argv.includes('--dev') || Boolean(process.env.VITE_DEV_SERVER_URL);
    if (isDevRun) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    ipcMain.handle('save-file', async (event: any, content: any, filename: any) => {
        const { filePath } = await dialog.showSaveDialog({
            defaultPath: filename,
            filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });
        if (filePath) {
            fs.writeFileSync(filePath, content);
            return { success: true };
        }
        return { success: false };
    });

    ipcMain.handle('open-file', async () => {
        const { filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });
        if (filePaths && filePaths.length > 0) {
            return { success: true, content: fs.readFileSync(filePaths[0], 'utf-8') };
        }
        return { success: false, error: 'No file selected' };
    });

    ipcMain.handle('get-app-version', () => app.getVersion());

    ipcMain.handle('get-printers', async () => {
        try {
            // Use PowerShell Get-Printer for reliable Windows printer detection
            // Chromium's getPrintersAsync() can return empty on some systems
            const stdout = execSync(
                'powershell -NoProfile -Command "Get-Printer | Select-Object -Property Name, PrinterStatus, DriverName | ConvertTo-Json"',
                { encoding: 'utf-8', timeout: 5000 }
            );
            const parsed = JSON.parse(stdout);
            // PowerShell returns a single object (not array) when there's only 1 printer
            const printerList = Array.isArray(parsed) ? parsed : [parsed];
            const printers = printerList.map((p: any) => ({
                name: p.Name,
                status: p.PrinterStatus === 0 ? 'Ready' : p.PrinterStatus,
                driverName: p.DriverName || ''
            }));
            console.log(`get-printers: Found ${printers.length} printers:`, printers.map((p: any) => p.name));
            return printers;
        } catch (error) {
            console.error('Failed to get printers via PowerShell:', error);
            // Fallback to Chromium API
            try {
                const targetWin = mainWindow || BrowserWindow.getAllWindows()[0];
                if (targetWin) {
                    const chromiumPrinters = await targetWin.webContents.getPrintersAsync();
                    return JSON.parse(JSON.stringify(chromiumPrinters));
                }
            } catch (fallbackError) {
                console.error('Chromium fallback also failed:', fallbackError);
            }
            return [];
        }
    });

    ipcMain.handle('print-to-pdf', async (event, htmlContent, pageSize) => {
        try {
            const printWin = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });
            activePrintWindows.add(printWin);
            await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
            await printWin.webContents.print({ 
                printBackground: true,
                pageSize: pageSize || 'A4'
            });
            
            setTimeout(() => {
                if (!printWin.isDestroyed()) {
                    printWin.close();
                }
                activePrintWindows.delete(printWin);
            }, 7000);

            return { success: true };
        } catch (error: any) {
            console.error('Print Preview Error:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('print-silent', async (event, htmlContent, printerName, pageSize) => {
        try {
            const printWin = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });
            activePrintWindows.add(printWin);
            await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
            
            // Allow time for images/fonts to load
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await printWin.webContents.print({ 
                silent: true, 
                deviceName: printerName,
                printBackground: true,
                pageSize: pageSize || 'A4',
                margins: { marginType: 'printableArea' }
            });

            // Do not close immediately. Give the Windows spooler time to receive the data.
            setTimeout(() => {
                if (!printWin.isDestroyed()) {
                    printWin.close();
                }
                activePrintWindows.delete(printWin);
            }, 7000);

            return { success: true };
        } catch (error: any) {
            console.error('Silent Print Error:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('save-pdf', async (event, htmlContent) => {
        try {
            const printWin = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });
            activePrintWindows.add(printWin);
            await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
            
            await new Promise(resolve => setTimeout(resolve, 500));

            const pdfData = await printWin.webContents.printToPDF({
                printBackground: true,
                pageSize: 'A5'
            });
            
            printWin.close();
            activePrintWindows.delete(printWin);

            const { filePath } = await dialog.showSaveDialog({
                filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
                defaultPath: 'measurement_slip.pdf'
            });

            if (filePath) {
                fs.writeFileSync(filePath, pdfData);
                return { success: true };
            }
            return { success: false, canceled: true };
        } catch (error: any) {
            console.error('Save PDF Error:', error);
            return { success: false, error: error.message };
        }
    });

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