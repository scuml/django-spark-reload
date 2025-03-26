import { Idiomorph } from "idiomorph"
import { reloadHtmlDocument } from "../helpers.js"
import { log } from "../logger.js"
import { StimulusReloader } from "./stimulus_reloader.js"

export class MorphHtmlReloader {
  static async reload() {
    return new MorphHtmlReloader().reload()
  }

  async reload() {
    await this.#reloadHtml()
    await this.#reloadStimulus()
  }

  async #reloadHtml() {
    log("Reload html with morph...")

    const reloadedDocument = await reloadHtmlDocument()
    Idiomorph.morph(document.head, reloadedDocument.head) // added this so 404 -> fixed pages load
    this.#updateBody(reloadedDocument.body)
    return reloadedDocument
  }

  #updateBody(newBody) {
    Idiomorph.morph(document.body, newBody)
  }

  async #reloadStimulus() {
    if(window.Stimulus){
      await StimulusReloader.reloadAll()
    }else{
      console.info("No stimulus - maybe reload all if js has changed?");
    }
  }
}
