import { MorphHtmlReloader } from "../reloaders/morph_html_reloader.js";
import { assetNameFromPath } from "../helpers.js";
import { CssReloader } from "../reloaders/css_reloader.js";
import { StimulusReloader } from "../reloaders/stimulus_reloader.js";

'use strict'

class DjangoListener {
  connect(){
    const dataset = document.currentScript.dataset
    const workerScriptPath = dataset.workerScriptPath
    const eventsPath = dataset.eventsPath

    if (!window.SharedWorker) {
      console.debug('😭 django-hyper-reload cannot work in this browser.')
    } else {
      const worker = new SharedWorker(workerScriptPath, {
        name: 'django-hyper-reload'
      })
      console.info("Listening");
      worker.port.addEventListener('message', (event) => {
        const message = event.data
        const reloadType = message.type;
        const path = message.path;
        console.info("Reload", reloadType, path);
        if (reloadType === 'reload') {
          console.info("Hard Reload");
          window.location.reload();
        } else if (reloadType === 'softreload') {
          console.info("Soft Reload");
          this.reloadHtml()
        } else if (reloadType === 'reloadcss') {
          console.info("ReloadCSS", path);
          this.reloadCss(path)
        } else if (reloadType === 'reloadstimulus') {
          console.info("ReloadStimulus", path);
          this.reloadStimulus(path.replace("/static/js/", ""))
          //this.reloadStimulus(path)
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
