'use strict'

import { app, protocol, BrowserWindow, shell } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import {
  createProtocol,
  installVueDevtools,
} from 'vue-cli-plugin-electron-builder/lib'
import express from 'express'
import expressWs from 'express-ws'
import fs from 'fs'
declare var __static: string
const isDevelopment = process.env.NODE_ENV !== 'production'
if (isDevelopment) {
  // Don't load any native (external) modules until the following line is run:
  // tslint:disable-next-line:no-var-requires
  require('module').globalPaths.push(process.env.NODE_MODULES_PATH)
}
let logPath: Nullable<string> = null
if (isDevelopment) {
  logPath = path.join(__dirname, '../recognition/result.txt')
} else {
  logPath = path.join(app.getPath('userData'), 'result.txt')
}

const { app: server } = expressWs(express())
server.use(express.static(path.join(__static, 'server/')))

server.ws('/', (ws) => {
  ws.on('message', (msg) => {
    if (logPath) {
      fs.writeFile(logPath, msg, 'utf8', (err: NodeJS.ErrnoException) => {
        if (err) {
          // tslint:disable-next-line:no-console
          return console.error(err)
        }
      })
    }
  })
})
server.listen(3000)

// global reference to mainWindow (necessary to prevent window from being garbage collected)
type Nullable<T> = T | null
let mainWindow: Nullable<BrowserWindow>

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })
function createMainWindow () {
  const window = new BrowserWindow({
    webPreferences: {
      devTools: false,
    },
  })

  if (isDevelopment) {
    // Load the url of the dev server if in development mode
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) { window.webContents.openDevTools() }
  } else {
    createProtocol('app')
    //   Load the index.html when not in development
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      }),
    )
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  window.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  mainWindow = createMainWindow()
})
