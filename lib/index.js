"use strict";

const fileTree = require("fs-file-tree")
    , path = require("path")
    , forEach = require("iterate-object")
    , typpy = require("typpy")
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
module.exports = function bloggifyFlexibleRouter (conf, Bloggify, cb) {
    let routesRoot = `${Bloggify.paths.root}/${conf.routes_dir}`;
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
                         , uri = dir.replace(routesRoot, "") + "/" + (fileName === "index" ? "" : fileName)
                         ;

                       Bloggify.server.addPage(uri, lien => {
                           Bloggify.render(lien, obj.path);
                       });
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
    if (conf.errorPages) {
        let obj = {};
        let path404 = conf.errorPages["404"];
        let path500 = conf.errorPages["500"];

        if (path404) {
            obj.notFound = lien => {
                Bloggify.render(lien, `${routesRoot}/${path404}`);
            };
        }
        if (path500) {
            obj.serverError = lien => {
                Bloggify.render(lien, "500");
            };
            Bloggify.viewer.registerTemplate("500", `${routesRoot}/${conf.errorPages['500']}`, null, true);
        }
        Bloggify.server.errorPages(obj);

    }

    Bloggify.registerRouter(exports);
};
