var HotwireSpark = (function () {
  'use strict';

  var adapters = {
    logger: typeof console !== "undefined" ? console : undefined,
  };

  var logger = {
    log(...messages) {
      if (this.enabled) {
        messages.push(Date.now());
        adapters.logger.log("[ActionCable]", ...messages);
      }
    }
  };

  const now = () => (new Date).getTime();

  const secondsSince = time => (now() - time) / 1e3;

  function getConfigurationProperty(name) {
    return document.querySelector(`meta[name="hotwire-spark:${name}"]`)?.content;
  }

  function assetNameFromPath(path) {
    return path.split("/").pop().split(".")[0];
  }
  function pathWithoutAssetDigest(path) {
    return path.replace(/-[a-z0-9]+\.(\w+)(\?.*)?$/, ".$1");
  }
  function urlWithParams(urlString, params) {
    const url = new URL(urlString, window.location.origin);
    Object.entries(params).forEach(_ref => {
      let [key, value] = _ref;
      url.searchParams.set(key, value);
    });
    return url.toString();
  }
  function cacheBustedUrl(urlString) {
    return urlWithParams(urlString, {
      reload: Date.now()
    });
  }
  async function reloadHtmlDocument() {
    let currentUrl = cacheBustedUrl(urlWithParams(window.location.href, {
      hotwire_spark: "true"
    }));
    const response = await fetch(currentUrl, {
      headers: {
        "Accept": "text/html"
      }
    });
    if (!response.ok) {
      throw new Error(`${response.status} when fetching ${currentUrl}`);
    }
    const fetchedHTML = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(fetchedHTML, "text/html");
  }


  // base IIFE to define idiomorph
  var Idiomorph = (function () {


      /**
       *
       * @param {string} newContent
       * @returns {Node | null | DocumentFragment}
       */
      function parseContent(newContent) {
        let parser = new DOMParser();

        // remove svgs to avoid false-positive matches on head, etc.
        let contentWithSvgsRemoved = newContent.replace(
          /<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim,
          "",
        );

        // if the newContent contains a html, head or body tag, we can simply parse it w/o wrapping
        if (
          contentWithSvgsRemoved.match(/<\/html>/) ||
          contentWithSvgsRemoved.match(/<\/head>/) ||
          contentWithSvgsRemoved.match(/<\/body>/)
        ) {
          let content = parser.parseFromString(newContent, "text/html");
          // if it is a full HTML document, return the document itself as the parent container
          if (contentWithSvgsRemoved.match(/<\/html>/)) {
            generatedByIdiomorph.add(content);
            return content;
          } else {
            // otherwise return the html element as the parent container
            let htmlElement = content.firstChild;
            if (htmlElement) {
              generatedByIdiomorph.add(htmlElement);
            }
            return htmlElement;
          }
        } else {
          // if it is partial HTML, wrap it in a template tag to provide a parent element and also to help
          // deal with touchy tags like tr, tbody, etc.
          let responseDoc = parser.parseFromString(
            "<body><template>" + newContent + "</template></body>",
            "text/html",
          );
          let content = /** @type {HTMLTemplateElement} */ (
            responseDoc.body.querySelector("template")
          ).content;
          generatedByIdiomorph.add(content);
          return content;
        }
      }

      return { normalizeElement, normalizeParent };
    })();

    //=============================================================================
    // This is what ends up becoming the Idiomorph global object
    //=============================================================================
    return {
      morph,
      defaults,
    };
  })();

  function log() {
    if (HotwireSpark$1.config.loggingEnabled) {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      console.log(`[hotwire_spark]`, ...args);
    }
  }

  class StimulusReloader {
    static async reload(changedFilePath) {
      const document = await reloadHtmlDocument();
      return new StimulusReloader(document, changedFilePath).reload();
    }
    static async reloadAll() {
      Stimulus.controllers.forEach(controller => {
        Stimulus.unload(controller.identifier);
        Stimulus.register(controller.identifier, controller.constructor);
      });
      return Promise.resolve();
    }
    constructor(document, changedFilePath) {
      this.document = document;
      this.changedFilePath = changedFilePath;
      this.application = window.Stimulus;
    }
    async reload() {
      console.info("Reload Stimulus controllers...");
      this.application.stop();
      await this.#reloadChangedStimulusControllers();
      this.#unloadDeletedStimulusControllers();
      this.application.start();
    }
    async #reloadChangedStimulusControllers() {
      await Promise.all(this.#stimulusControllerPathsToReload.map(async moduleName => this.#reloadStimulusController(moduleName)));
    }
    get #stimulusControllerPathsToReload() {
      this.controllerPathsToReload = this.controllerPathsToReload || this.#stimulusControllerPaths.filter(path => this.#shouldReloadController(path));
      return this.controllerPathsToReload;
    }
    get #stimulusControllerPaths() {
      return Object.keys(this.#stimulusPathsByModule).filter(path => path.endsWith("_controller"));
    }
    #shouldReloadController(path) {
      console.info("shoudl reload", this.#shouldReloadController(path), this.#extractControllerName(path));

      return this.#extractControllerName(path) === this.#changedControllerIdentifier;
    }
    get #changedControllerIdentifier() {
      this.changedControllerIdentifier = this.changedControllerIdentifier || this.#extractControllerName(this.changedFilePath);
      return this.changedControllerIdentifier;
    }
    get #stimulusPathsByModule() {
      this.pathsByModule = this.pathsByModule || this.#parseImportmapJson();
      return this.pathsByModule;
    }
    #parseImportmapJson() {
      const importmapScript = this.document.querySelector("script[type=importmap]");
      if(importmapScript){
        return JSON.parse(importmapScript.text).imports;
      }
    }
    async #reloadStimulusController(moduleName) {
      console.info(`\t${moduleName}`);
      const controllerName = this.#extractControllerName(moduleName);
      const path = cacheBustedUrl(this.#pathForModuleName(moduleName));
      const module = await import(path);
      this.#registerController(controllerName, module);
    }
    #unloadDeletedStimulusControllers() {
      this.#controllersToUnload.forEach(controller => this.#deregisterController(controller.identifier));
    }
    get #controllersToUnload() {
      if (this.#didChangeTriggerAReload) {
        return [];  // If we reloaded something, no need to unload
      } else {
        // If no reload occurred, unload controllers matching the changed identifier
        return this.application.controllers.filter(
          controller => this.#changedControllerIdentifier === controller.identifier
        );
      }
    }
    get #didChangeTriggerAReload() {
      return this.#stimulusControllerPathsToReload.length > 0;
    }
    #pathForModuleName(moduleName) {
      return this.#stimulusPathsByModule[moduleName];
    }
    #extractControllerName(path) {
      // If packed and has a format like this: "/static/js/src_controllers_common_radiorow_controller_js.js"
      const pattern = /controllers_(.+?)_controller/;
      const match = path.match(pattern);
      if(match){
        return match[1]
          .replace(/_/g, "--")                 // Convert underscores to dashes
      }
      // If not packed...
      return path
        .replace(/^\/+/, "")                // Remove leading slashes
        .replace(/^controllers\//, "")       // Remove controllers directory prefix
        .replace("_controller", "")          // Remove _controller suffix
        .replace(/\//g, "--")               // Convert directory separators to --
        .replace(/_/g, "-")                 // Convert underscores to dashes
        .replace(/\.js$/, "");              // Remove .js extension
    }
    #registerController(name, module) {
      this.application.unload(name);
      this.application.register(name, module.default);
    }
    #deregisterController(name) {
      console.info(`\tRemoving controller ${name}`);
      this.application.unload(name);
    }
  }

  class MorphHtmlReloader {
    static async reload() {
      return new MorphHtmlReloader().reload();
    }
    async reload() {
      await this.#reloadHtml();
      await this.#reloadStimulus();
    }
    async #reloadHtml() {
      log("Reload html with morph...");
      const reloadedDocument = await reloadHtmlDocument();
      this.#updateBody(reloadedDocument.body);
      return reloadedDocument;
    }
    #updateBody(newBody) {
      Idiomorph.morph(document.body, newBody);
    }
    async #reloadStimulus() {
      await StimulusReloader.reloadAll();
    }
  }

  class CssReloader {
    static async reload() {
      for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
      }
      return new CssReloader(...params).reload();
    }
    static async reloadLink(link) {
      return new CssReloader().#reloadLinkIfNeeded(link)
    }
    constructor() {
      let filePattern = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : /./;
      this.filePattern = filePattern;
    }
    async reload() {
      log("Reload css...");
      await Promise.all(await this.#reloadAllLinks());
    }
    async #reloadAllLinks() {
      const cssLinks = await this.#loadNewCssLinks();
      console.info(cssLinks);
      return cssLinks.map(link => this.#reloadLinkIfNeeded(link));
    }
    async #loadNewCssLinks() {
      const reloadedDocument = await reloadHtmlDocument();
      return Array.from(reloadedDocument.head.querySelectorAll("link[rel='stylesheet']"));
    }
    #reloadLinkIfNeeded(link) {
      if (this.#shouldReloadLink(link)) {
        return this.#reloadLink(link);
      } else {
        return Promise.resolve();
      }
    }
    #shouldReloadLink(link) {
      return this.filePattern.test(link.getAttribute("href"));
    }
    async #reloadLink(link) {
      console.info('reloadlink', link);
      return new Promise(resolve => {
        const href = link.getAttribute("href");
        const newLink = this.#findExistingLinkFor(link) || this.#appendNewLink(link);
        newLink.setAttribute("href", cacheBustedUrl(link.getAttribute("href")));
        newLink.onload = () => {
          log(`\t${href}`);
          resolve();
        };
      });
    }
    #findExistingLinkFor(link) {
      return this.#cssLinks.find(newLink => pathWithoutAssetDigest(link.href) === pathWithoutAssetDigest(newLink.href));
    }
    get #cssLinks() {
      return Array.from(document.querySelectorAll("link[rel='stylesheet']"));
    }
    #appendNewLink(link) {
      document.head.append(link);
      return link;
    }
  }

  class ReplaceHtmlReloader {
    static async reload() {
      return new ReplaceHtmlReloader().reload();
    }
    async reload() {
      await this.#reloadHtml();
    }
    async #reloadHtml() {
      log("Reload html with Turbo...");
      this.#keepScrollPosition();
      await this.#visitCurrentPage();
    }
    #keepScrollPosition() {
      document.addEventListener("turbo:before-render", () => {
        Turbo.navigator.currentVisit.scrolled = true;
      }, {
        once: true
      });
    }
    #visitCurrentPage() {
      return new Promise(resolve => {
        document.addEventListener("turbo:load", () => resolve(document), {
          once: true
        });
        window.Turbo.visit(window.location);
      });
    }
  }

  // consumer.subscriptions.create({
  //   channel: "Hotwire::Spark::Channel"
  // }, {
  //   connected() {
  //     document.body.setAttribute("data-hotwire-spark-ready", "");
  //   },
  //   async received(message) {
  //     try {
  //       await this.dispatch(message);
  //     } catch (error) {
  //       console.log(`Error on ${message.action}`, error);
  //     }
  //   },
  //   dispatch(_ref) {
  //     let {
  //       action,
  //       path
  //     } = _ref;
  //     switch (action) {
  //       case "reload_html":
  //         return this.reloadHtml();
  //       case "reload_css":
  //         return this.reloadCss(path);
  //       case "reload_stimulus":
  //         return this.reloadStimulus(path);
  //       default:
  //         throw new Error(`Unknown action: ${action}`);
  //     }
  //   },
  //   reloadHtml() {
  //     const htmlReloader = HotwireSpark.config.htmlReloadMethod == "morph" ? MorphHtmlReloader : ReplaceHtmlReloader;
  //     return htmlReloader.reload();
  //   },
  //   reloadCss(path) {
  //     const fileName = assetNameFromPath(path);
  //     return CssReloader.reload(new RegExp(fileName));
  //   },
  //   reloadStimulus(path) {
  //     return StimulusReloader.reload(path);
  //   }
  // });


  function reloadHtml() {
    const htmlReloader = HotwireSpark.config.htmlReloadMethod == "morph" ? MorphHtmlReloader : ReplaceHtmlReloader;
    return htmlReloader.reload();
  }
  function reloadCss(path) {
    const fileName = assetNameFromPath(path);
    // return CssReloader.reload(new RegExp(fileName));
    console.info("1--", path, fileName);
    //return CssReloader.reload(new RegExp(fileName));
    // this is way faster than the oterh route
    const matchingElements = document.head.querySelectorAll(`link[rel='stylesheet'][href*='${path}']`)
    const lastMatchingElement = matchingElements[matchingElements.length - 1];
    console.info("match", lastMatchingElement);
    return CssReloader.reloadLink(lastMatchingElement);
  }
  function reloadStimulus(path) {
    //const reloader = new StimulusReloader(document, path)
    //return reloader.reloadAll()
    return StimulusReloader.reloadAll();
  }

  const HotwireSpark$1 = {
    config: {
      loggingEnabled: false,
      htmlReloadMethod: "morph"
    },
    reloadHtml: reloadHtml,
    reloadCss: reloadCss,
    reloadStimulus: reloadStimulus,
    reloadHtmlDocument: reloadHtmlDocument,
  };
  const configProperties = {
    loggingEnabled: "logging",
    htmlReloadMethod: "html-reload-method"
  };
  document.addEventListener("DOMContentLoaded", function () {
    Object.entries(configProperties).forEach(_ref => {
      let [key, property] = _ref;
      HotwireSpark$1.config[key] = getConfigurationProperty(property);
    });
  });

  return HotwireSpark$1;

})();
