import { log } from "../logger.js"
import { cacheBustedUrl, reloadHtmlDocument } from "../helpers.js"

export class StimulusReloader {
  static async reload(changedFilePath) {
    const document = await reloadHtmlDocument()
    return new StimulusReloader(document, changedFilePath).reload()
  }

  static async reloadAll() {
    Stimulus.controllers.forEach(controller => {
      Stimulus.unload(controller.identifier)
      Stimulus.register(controller.identifier, controller.constructor)
    })

    return Promise.resolve()
  }

  constructor(document, changedFilePath) {
    this.document = document
    this.changedFilePath = changedFilePath
    this.application = window.Stimulus
  }

  async reload() {
    log("Reload Stimulus controllers...")

    this.application.stop()

    await this.#reloadChangedStimulusControllers()
    this.#unloadDeletedStimulusControllers()

    this.application.start()
  }

  async #reloadChangedStimulusControllers() {
    log("Reload Stimulus controllers2...")

    await Promise.all(
      this.#stimulusControllerPathsToReload.map(async moduleName => this.#reloadStimulusController(moduleName))
    )
  }

  get #stimulusControllerPathsToReload() {
    //this.controllerPathsToReload = this.controllerPathsToReload || this.#stimulusControllerPaths.filter(path => this.#shouldReloadController(path))
    this.controllerPathsToReload = this.controllerPathsToReload || this.#djDetermineStimulusPathsToReload
    log("Should reload Paths..", this.controllerPathsToReload)

    return this.controllerPathsToReload
  }

  get #stimulusControllerPaths() {
    return Object.keys(this.#stimulusPathsByModule).filter(path => path.endsWith("_controller"))
  }

  get #djDetermineStimulusPathsToReload(){
    // putting this in one method is easier to understand.  Codin' dirty.
    const matchingKeys = [];

    // this.changedFilePath;
    const changedControllerIdentifier = this.#extractControllerName(this.changedFilePath);
    Object.entries(this.#stimulusPathsByModule).forEach(([key, path]) => {
      if(this.changedFilePath == path){
        console.info("key found",key, this.changedFilePath);
        matchingKeys.push(key);
        return;
      }
      const parts = changedControllerIdentifier.split("--");
      console.info("parts", parts);
      // match up parts one by one to see if there's a match, `dir1--dir2--mod` -> `dir2--mod` -> `mod`
      for (let i = 1; i < parts.length; i++) {
        console.info("part", parts.slice(i).join("--"), key);
        if(key === parts.slice(i).join("--") || key + "_controller" === parts.slice(i).join("--")){
          console.info("key found",key, this.changedFilePath);
          matchingKeys.push(key);
          return;
        }
      }
    });
    return matchingKeys;
  }

  #shouldReloadController(path) {
    const controllerName = this.#extractControllerName(path);
    log("SHOULDY", path, this.#extractControllerName(path), this.#changedControllerIdentifier, );
    return this.#extractControllerName(path) === this.#changedControllerIdentifier
  }

  get #changedControllerIdentifier() {
    this.changedControllerIdentifier = this.changedControllerIdentifier || this.#extractControllerName(this.changedFilePath)
    return this.changedControllerIdentifier
  }

  get #stimulusPathsByModule() {
    this.pathsByModule = this.pathsByModule || this.#parseImportmapJson()
    log("stimulus paths by module", this.pathsByModule);
    return this.pathsByModule
  }

  #parseImportmapJson() {
    const importmapScript = this.document.querySelector("script[type=importmap]")
    // ADDED BY ME
    if(!importmapScript){
      return this.#makeTempImportMap();
    }
    return JSON.parse(importmapScript.text).imports
  }

  // ADDED BY ME
  #makeTempImportMap() {
    const resources = performance.getEntriesByType("resource");
    const jsFiles = resources
      .filter(entry => entry.initiatorType === "script")
      .map(entry => entry.name);

    const controllers = {};

    jsFiles.forEach(url => {
      // Check if the URL ends with "_controller.js" (ignoring query params)
      const path = url.split('?')[0]; // Remove query parameters
      if (path.endsWith('_controller.js')) {
        // Parse the URL to extract the pathname (removes hostname)
        const urlObj = new URL(url);
        const relativePath = urlObj.pathname; // e.g., "/static/js/controllers/musicplayer_controller.js"

        // Extract the filename without extension for the key
        const key = relativePath.split('/').pop().replace('.js', '');
        controllers[key] = relativePath;
      }
    });
    log("Manual importmap created:", controllers)
    return controllers;
  }

  async #reloadStimulusController(moduleName) {
    log(`\t${moduleName}`)

    const controllerName = this.#extractControllerName(moduleName)
    const path = cacheBustedUrl(this.#pathForModuleName(moduleName))

    const module = await import(path)

    this.#registerController(controllerName, module)
  }

  #unloadDeletedStimulusControllers() {
    this.#controllersToUnload.forEach(controller => this.#deregisterController(controller.identifier))
  }

  get #controllersToUnload() {
    if (this.#didChangeTriggerAReload) {
      return []
    } else {
      return this.application.controllers.filter(controller => this.#changedControllerIdentifier === controller.identifier)
    }
  }

  get #didChangeTriggerAReload() {
    return this.#stimulusControllerPathsToReload.length > 0
  }

  #pathForModuleName(moduleName) {
    log("path for", moduleName, this.#stimulusPathsByModule[moduleName]);
    return this.#stimulusPathsByModule[moduleName]
  }

  #extractControllerName(path) {
    return path
      .replace(/^\/+/, "")
      .replace(/^controllers\//, "")
      .replace("_controller", "")
      .replace(/\//g, "--")
      .replace(/_/g, "-")
      .replace(/\.js$/, "")
  }

  #registerController(name, module) {
    this.application.unload(name)
    this.application.register(name, module.default)
  }

  #deregisterController(name) {
    log(`\tRemoving controller ${name}`)
    this.application.unload(name)
  }
}
