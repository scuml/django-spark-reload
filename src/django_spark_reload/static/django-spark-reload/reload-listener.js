'use strict'

{
  const dataset = document.currentScript.dataset
  const workerScriptPath = dataset.workerScriptPath
  const eventsPath = dataset.eventsPath

  if (!window.SharedWorker) {
    console.debug('😭 django-spark-reload cannot work in this browser.')
  } else {
    const worker = new SharedWorker(workerScriptPath, {
      name: 'django-spark-reload'
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
        HotwireSpark.reloadHtml()
      } else if (reloadType === 'reloadcss') {
        console.info("ReloadCSS", path);
        HotwireSpark.reloadCss(path)
      } else if (reloadType === 'reloadstimulus') {
        console.info("ReloadStimulus", path);
        HotwireSpark.reloadStimulus(path)
      }

    })

    worker.port.postMessage({
      type: 'initialize',
      eventsPath
    })

    worker.port.start()
  }
}
