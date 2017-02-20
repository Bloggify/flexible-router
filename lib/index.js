"use strict";

const fileTree = require("fs-file-tree")
    , path = require("path")
    , forEach = require("iterate-object")
    , typpy = require("typpy")
    , upath = require("upath")
    , httpMethods = require("methods")
    ;

/**
 * bloggifyFlexibleRouter
 * A flexible router for Bloggify apps.
 *
 * @name bloggifyFlexibleRouter
 * @function
 * @param {Number} a Param descrpition.
 * @param {Number} b Param descrpition.
 * @return {Number} Return description.
 */
module.exports = function bloggifyFlexibleRouter (config, Bloggify, cb) {
    const routesRoot = `${Bloggify.paths.root}/${config.routes_dir}`
        , controllersRoot = `${Bloggify.paths.root}/${config.controllers_dir}`
        ;

    fileTree(routesRoot, (err, paths) => {
        if (err) {
            Bloggify.log(err, "warn");
        } else {
            let walk = (obj, file) => {
               if (typpy(obj, Object)) {
                   if (obj.path && obj.stat) {
                       let parsed = path.parse(obj.path)
                         , fileName = parsed.name
                         , dir = parsed.dir
                         , relPath = upath.normalize(dir).replace(upath.normalize(routesRoot), "")
                         , uri = (relPath + "/" + (fileName === "index" ? "" : fileName)).replace(/\_/g, ":")
                         , controllerPath = controllersRoot + relPath + "/" + (fileName === "index" ? "" : fileName)
                         ;

                       let hooks = null
                         , controller = null
                         ;

                       try {
                           controller = require(controllerPath);
                           hooks = {};
                           if (typeof controller === "function") {
                                httpMethods.forEach(c => hooks[c] = controller);
                           } else {
                               hooks = controller;
                               forEach(hooks, (fn, meth) => {
                                    if (!httpMethods.includes(meth)) {
                                        Bloggify.log(`In ${controllerPath} you configured a method ${meth}, but that's not a supported HTTP method.`);
                                    }
                               });
                           }
                       } catch (e) {
                           if (!e.message.includes(controllerPath)) {
                               Bloggify.log(e);
                           } else if (e.code !== "MODULE_NOT_FOUND") {
                               Bloggify.log(e);
                           }
                       }

                       if (hooks) {
                           Bloggify.server.addPage(uri, lien => {
                               let fn = hooks[lien.method];
                               if (fn) {
                                   fn(lien, (err, data) => {
                                       if (err) {
                                           return Bloggify.render(lien, "500", {
                                                error: err
                                           })
                                       }
                                       Bloggify.render(lien, obj.path, data);
                                   });
                               } else {
                                   Bloggify.render(lien, obj.path);
                               }
                           });
                       } else {
                           Bloggify.server.addPage(uri, lien => {
                               Bloggify.render(lien, obj.path);
                           });
                       }
                   } else {
                       forEach(obj, walk)
                   }
               }
            };
            walk(paths);
        }
        cb();
    });

    // Handle the error pages
    if (config.errorPages) {
        let obj = {};
        let path404 = config.errorPages["404"];
        let path500 = config.errorPages["500"];

        if (path404) {
            obj.notFound = lien => {
                Bloggify.render(lien, `${routesRoot}/${path404}`);
            };
        }
        if (path500) {
            obj.serverError = lien => {
                Bloggify.render(lien, "500");
            };
            Bloggify.viewer.registerTemplate("500", `${routesRoot}/${config.errorPages['500']}`, null, true);
        }
        Bloggify.server.errorPages(obj);

    }

    Bloggify.registerRouter(exports);
};
