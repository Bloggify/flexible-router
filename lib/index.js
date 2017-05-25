"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fileTree = require("fs-file-tree"),
    path = require("path"),
    forEach = require("iterate-object"),
    typpy = require("typpy"),
    upath = require("upath"),
    httpMethods = require("methods");

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
module.exports = function bloggifyFlexibleRouter(config, Bloggify, cb) {

    var routesRoot = Bloggify.paths.root + "/" + config.routes_dir,
        controllersRoot = Bloggify.paths.root + "/" + config.controllers_dir;

    fileTree(routesRoot, function (err, paths) {
        if (err) {
            Bloggify.log(err, "warn");
        } else {
            (function () {
                var walk = function walk(obj, file) {
                    if (typpy(obj, Object)) {
                        if (obj.path && obj.stat) {
                            (function () {
                                var parsed = path.parse(obj.path),
                                    fileName = parsed.name,
                                    dir = parsed.dir,
                                    relPath = upath.normalize(dir).replace(upath.normalize(routesRoot), ""),
                                    uri = (relPath + "/" + (fileName === "index" ? "" : fileName)).replace(/\_/g, ":"),
                                    controllerPath = controllersRoot + relPath + "/" + (fileName === "index" ? "" : fileName);

                                var hooks = null,
                                    controller = null;

                                try {
                                    controller = require(controllerPath);
                                    hooks = {};
                                    if (typeof controller === "function") {
                                        ["all"].concat(httpMethods).forEach(function (c) {
                                            return hooks[c] = controller;
                                        });
                                    } else {
                                        hooks = controller;
                                        forEach(hooks, function (fn, meth) {
                                            if (!httpMethods.includes(meth)) {
                                                switch (meth) {
                                                    case "before":
                                                    case "after":
                                                    case "use":
                                                        Bloggify.server[meth](uri, fn);
                                                        break;
                                                    default:
                                                        Bloggify.log("In " + controllerPath + " you configured a method " + meth + ", but that's not a supported HTTP method.");
                                                        break;
                                                }
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
                                    Bloggify.server.addPage(uri, function (ctx) {
                                        var fn = hooks[ctx.method] || hooks.all;
                                        if (fn) {
                                            (function () {
                                                var done = function done(err, data) {
                                                    if (err) {
                                                        return Bloggify.render(ctx, "500", {
                                                            error: err,
                                                            statusCode: 500
                                                        });
                                                    }
                                                    Bloggify.render(ctx, obj.path, data);
                                                };
                                                var maybePromise = fn(ctx, done);
                                                if (maybePromise && _typeof(maybePromise.then)) {
                                                    maybePromise.then(function (data) {
                                                        if (data === null) {
                                                            return;
                                                        }
                                                        process.nextTick(function () {
                                                            done(null, data);
                                                        });
                                                    }).catch(function (err) {
                                                        done(null, { err: err });
                                                    });
                                                }
                                            })();
                                        } else {
                                            Bloggify.render(ctx, obj.path);
                                        }
                                    });
                                } else {
                                    Bloggify.server.addPage(uri, function (ctx) {
                                        Bloggify.render(ctx, obj.path);
                                    });
                                }
                            })();
                        } else {
                            forEach(obj, walk);
                        }
                    }
                };
                walk(paths);
            })();
        }
        cb();
    });

    // Handle the error pages
    if (config.error_pages) {
        (function () {
            var obj = {};
            var path404 = config.error_pages["404"];
            var path500 = config.error_pages["500"];
            var pathBadToken = config.error_pages.bad_csrf;

            if (path404) {
                obj.notFound = function (ctx) {
                    Bloggify.render(ctx, routesRoot + "/" + path404, {
                        statusCode: 404
                    });
                };
            }

            if (path500) {
                obj.serverError = function (ctx) {
                    Bloggify.render(ctx, "500", {
                        statusCode: 500
                    });
                };
                Bloggify.viewer.registerTemplate("500", routesRoot + "/" + config.error_pages['500'], null, true);
            }

            if (pathBadToken) {
                obj.badCsrf = function (ctx) {
                    Bloggify.render(ctx, "bad-csrf-token", {
                        statusCode: 422
                    });
                };
                Bloggify.viewer.registerTemplate("bad-csrf-token", routesRoot + "/" + config.error_pages.bad_csrf, null, true);
            }

            Bloggify.server.errorPages(obj);
        })();
    }

    Bloggify.registerRouter(exports);
};