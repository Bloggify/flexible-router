"use strict";

const fileTree = require("fs-file-tree")
    , path = require("path")
    , forEach = require("iterate-object")
    , typpy = require("typpy")
    , upath = require("upath")
    , httpMethods = require("methods")
    ;

/**
 * @name bloggify:init
 * @function
 * @param {Object} config
 *
 *  - `routes_dir` (String): The path to the directory where the routes are stored. They should be randable view files. For dynamic routes, use the `_`character.
 *  - `controllers_dir` (String): The path to the controllers directory.
 *  - `error_pages` (Object): The error pages template names.
 *      - `404` (String): The path to the `404` error page.
 *      - `500` (String): The path to the `500` error page.
 *      - `bad_csrf` (String): The path the template that should be rendered when a bad CSRF token is sent to the server.
 *
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
                                              , statusCode: 500
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
    if (config.error_pages) {
        let obj = {};
        let path404 = config.error_pages["404"];
        let path500 = config.error_pages["500"];
        let pathBadToken = config.error_pages.bad_csrf;

        if (path404) {
            obj.notFound = lien => {
                Bloggify.render(lien, `${routesRoot}/${path404}`, {
                    statusCode: 404
                });
            };
        }

        if (path500) {
            obj.serverError = lien => {
                Bloggify.render(lien, "500", {
                    statusCode: 500
                });
            };
            Bloggify.viewer.registerTemplate("500", `${routesRoot}/${config.error_pages['500']}`, null, true);
        }

        if (pathBadToken) {
            obj.badCsrf = lien => {
                Bloggify.render(lien, "bad-csrf-token", {
                    statusCode: 422
                });
            };
            Bloggify.viewer.registerTemplate("bad-csrf-token", `${routesRoot}/${config.error_pages.bad_csrf}`, null, true);
        }


        Bloggify.server.errorPages(obj);
    }

    Bloggify.registerRouter(exports);
};