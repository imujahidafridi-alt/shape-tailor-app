import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    saveFile: (content: string, filename: string) => 
        ipcRenderer.invoke('save-file', content, filename),
    openFile: () => ipcRenderer.invoke('open-file'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    printToPDF: (htmlContent: string, pageSize?: string) => ipcRenderer.invoke('print-to-pdf', htmlContent, pageSize),
    printSilent: (htmlContent: string, printerName: string, pageSize?: string) => ipcRenderer.invoke('print-silent', htmlContent, printerName, pageSize),
    savePDF: (htmlContent: string) => ipcRenderer.invoke('save-pdf', htmlContent)
});