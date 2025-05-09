import { MorphHtmlReloader } from "../reloaders/morph_html_reloader.js";
import { assetNameFromPath } from "../helpers.js";
import { CssReloader } from "../reloaders/css_reloader.js";
import { StimulusReloader } from "../reloaders/stimulus_reloader.js";
import { log } from "../logger.js"

'use strict'

class DjangoListener {
  connect(){
    const dataset = document.currentScript.dataset
    const workerScriptPath = dataset.workerScriptPath
    const eventsPath = dataset.eventsPath
    const hardReloadStatusCodes = ['400', '401', '402', '403', '404', '500'];

    if (!window.SharedWorker) {
      console.debug('😭 django-spark-reload cannot work in this browser.')
    } else {
      const worker = new SharedWorker(workerScriptPath, {
        name: 'django-spark-reload'
      })
      log("DJANGO LISTENER: Listening");
      worker.port.addEventListener('message', (event) => {
        const message = event.data
        const reloadType = message.type;
        const path = message.path;
        const previousStatusCode = dataset.statusCode
        log("DJANGO LISTENER: Reload", reloadType, path);
        if (reloadType === 'reload' || hardReloadStatusCodes.includes(previousStatusCode) ) {
          log("DJANGO LISTENER: Hard Reload");
          window.location.reload();
        } else if (reloadType === 'softreload') {
          log("DJANGO LISTENER: Soft Reload");
          this.reloadHtml()
        } else if (reloadType === 'reloadcss') {
          log("DJANGO LISTENER: ReloadCSS", path);
          this.reloadCss(path)
        } else if (reloadType === 'reloadstimulus') {
          log("DJANGO LISTENER: ReloadStimulus", path);
          //this.reloadStimulus(path.replace("/static/js/", ""))
          this.reloadStimulus(path)
        }

      })

      worker.port.postMessage({
        type: 'initialize',
        eventsPath
      })

      worker.port.start()
    }
  }

  reloadHtml() {
    return MorphHtmlReloader.reload()
  }

  reloadCss(path) {
    const fileName = assetNameFromPath(path)
    return CssReloader.reloadFileOnly(new RegExp(fileName))
  }

  reloadStimulus(path) {
    return StimulusReloader.reload(path)
  }

}
const listener = new DjangoListener()
listener.connect()
