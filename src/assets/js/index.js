/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';
const { ipcRenderer } = require('electron');
import { config } from './utils.js';
const { ipcMain, BrowserWindow } = require('electron');

let dev = process.env.NODE_ENV === 'dev';
const clientId = '1211151644792856616';
const DiscordRPC = require('discord-rpc');
const RPC = new DiscordRPC.Client({ transport: 'ipc'});

async function setActivity() {
    if (!RPC) return;
    RPC.setActivity({
        details: `¡Nuevo Evento!`,
        state: `Ingresando al servidor`,
        startTimestamp: Date.now(),
        largeImageKey: 'https://media.discordapp.net/attachments/1201597666379964579/1202481017689210940/Screenshot_20240129_030525_KineMaster.jpg?ex=65e011b7&is=65cd9cb7&hm=341e8d5e533abef67124d074956aef5508bc3e480064d5101b2fe3bd93569104&=&format=webp&width=570&height=473',
        largeImageText: `Master Client`,
        instance: false,
        buttons: [
            {
                label: `Discord`,
                url: `https://discord.gg/Rwm7ZaN6kd`,
            },
            {
                label: `Twitch`,
                url: `https://www.twitch.tv/master62_`,
            }
        ]
    });
 };
 
RPC.on('ready', async () => {
    setActivity();

    setInterval(() => {
        setActivity();
    }, 86400 * 1000);
});

RPC.login({ clientId }).catch(err => console.error(err));


class Splash {
    constructor() {
        this.splash = document.querySelector(".splash");
        this.splashMessage = document.querySelector(".splash-message");
        this.splashAuthor = document.querySelector(".splash-author");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector("progress");
        document.addEventListener('DOMContentLoaded', () => this.startAnimation());
    }

    async startAnimation() {
        let splashes = [
            { "message": "Cargando Master Client", "author": "" },
            { "message": "", "author": "" },
            { "message": "", "author": "" }
        ]
        let splash = splashes[Math.floor(Math.random() * splashes.length)];
        this.splashMessage.textContent = splash.message;
        this.splashAuthor.children[0].textContent = "" + splash.author;
        await sleep(100);
        document.querySelector("#splash").style.display = "block";
        await sleep(500);
        this.splash.classList.add("opacity");
        await sleep(500);
        this.splash.classList.add("translate");
        this.splashMessage.classList.add("opacity");
        this.splashAuthor.classList.add("opacity");
        this.message.classList.add("opacity");
        await sleep(1000);
        this.checkUpdate();
    }

    async checkUpdate() {
        if (dev) return this.startLauncher();
        this.setStatus(`Bucando Actualizaciones...`);

        ipcRenderer.invoke('update-app').then(err => {
            if (err.error) {
                let error = err.message;
                this.shutdown(`Error al buscar actualizaciones:<br>${error}`);
            }
        })

        ipcRenderer.on('updateAvailable', () => {
            this.setStatus(`Actualizacion disponible !`);
            this.toggleProgress();
            ipcRenderer.send('start-update');
        })

        ipcRenderer.on('download-progress', (event, progress) => {
            this.setProgress(progress.transferred, progress.total);
        })

        ipcRenderer.on('update-not-available', () => {
            this.maintenanceCheck();
        })
    }

    async maintenanceCheck() {
        config.GetConfig().then(res => {
            if (res.maintenance) return this.shutdown(res.maintenance_message);
            this.startLauncher();
        }).catch(e => {
            console.error(e);
            return this.shutdown("Mala conexion a Internet detectada:<br>Reinicia tu wifi o avisa a un admin");
        })
    }

    startLauncher() {
        this.setStatus(`Iniciando el Launcher...`);
        ipcRenderer.send('main-window-open');
        ipcRenderer.send('update-window-close');
    }

    shutdown(text) {
        this.setStatus(`${text}<br>Cerrando en 5s`);
        let i = 4;
        setInterval(() => {
            this.setStatus(`${text}<br>Cerrando en ${i--}s`);
            if (i < 0) ipcRenderer.send('update-window-close');
        }, 1000);
    }

    setStatus(text) {
        this.message.innerHTML = text;
    }

    toggleProgress() {
        if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
    }

    setProgress(value, max) {
        this.progress.value = value;
        this.progress.max = max;
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
        ipcRenderer.send("update-window-dev-tools");
    }
})
new Splash();