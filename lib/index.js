import fileTree from "fs-file-tree"
import path from "path"
import forEach from "iterate-object"
import typpy from "typpy"
import httpMethods from "methods"
import setOrGet from "set-or-get"

const ERROR_PAGES_PATHS = {
    "/404": "notFound"
  , "/500": "serverError"
  , "/422": "badCsrf"
}

/**
 *
 * If the routes (default: `app/routes`) folder exists, it will dictate the routes structure. For example:
 *
 * `_` is alias for `index`. `_foo` is alias for `:foo`
 *
 *
 * ```
 * routes/
 * ├── 404.ajs                    << 404 page
 * ├── _.ajs                      << The index page (loaded on `/`)
 * ├── api                        << Rest API (`/api`)
 * │   ├── index.js               << Api Handlers (e.g. sending a custom 404)
 * │   └── users                  << The `/api/users[/...]` endpoint
 * │       ├── index.js           << Handling `/api/users` (sending the list of users)
 * │       └── _username          << Handling `/api/users/:username`
 * │           └── index.js       << Fetching the user, by username, and sending it
 * └── users                      << The users list, in HTML format (`/users`)
 *     ├── _.ajs                  << The `/users` view
 *     ├── _.js                   << The `/users` controler
 *     └── _user                  << `/users/:user` endpoint
 *         ├── _.ajs              << View
 *         └── _.js               << Controller
 * ```
 *
 * The controller files look like this:
 *
 * ```js
 * // Before hook
 * exports.before = (ctx, cb) => ...
 *
 * // After hook
 * exports.after = (ctx, cb) => ...
 *
 * // Handle all the methods
 * // Alias for module.exports = ctx => ...
 * exports.all = ctx => ...
 *
 * // Handle post requests
 * exports.post = ctx => ...
 * ```
 *
 * @name bloggify:init
 * @function
 * @param {Object} config
 *
 *  - `routes_dir` (String): The path to the directory where the routes are stored. They should be randable view files. For dynamic routes, use the `_`character.
 *
 */
export default async function bloggifyFlexibleRouter (config) {
    const routesRoot = path.resolve(Bloggify.paths.root, config.routes_dir)

    /*!
     * setUpErrorPages
     * Sets up the error pages
     *
     * @name setUpErrorPages
     * @function
     * @param {Object} errorPages The error pages object:
     *
     *  - `notFound` (String): The path to the 404 view.
     *  - `serverError` (String): The path to the 500 view.
     *  - `badCsrf` (String): The path to the 422 view.
     */
    const setUpErrorPages = errorPages => {

        const notFound = errorPages.notFound
        if (notFound) {
            errorPages.notFound = (ctx, data) => {
                data = data || {}
                data.statusCode = data.statusCode || 404
                data.error = data.error || new Error("Not found.")
                data.forceTemplateName = true
                Bloggify.render(ctx, notFound, data)
            }
        } else {
            errorPages.notFound = (ctx, data) => ctx.end(`404 – ${data && data.error && data.error.message || "Not Found."}`, 404)
        }

        Bloggify.renderer.registerTemplate("404", notFound || errorPages.notFound, null, true)

        const serverError = errorPages.serverError
        if (serverError) {
            errorPages.serverError = (ctx, data) => {
                data = data || {}
                data.statusCode = data.statusCode || 500
                data.forceTemplateName = true
                Bloggify.render(ctx, "500", data)
            }
        } else {
            errorPages.serverError = (ctx, data) => ctx.end(`500 – Internal Server Error.`, 500)
        }

        Bloggify.renderer.registerTemplate("500", serverError || errorPages.serverError, null, true)

        const badCsrf = errorPages.badCsrf
        if (badCsrf) {
            errorPages.badCsrf = (ctx, data) => {
                data = data || {}
                data.statusCode = data.statusCode || 422
                data.forceTemplateName = true
                Bloggify.render(ctx, badCsrf, data)
            }
        } else {
            errorPages.badCsrf = ctx => ctx.end("Your browser did something unexpected. Try refreshing the page. Contact us if the problem persists.", 422)
        }
        Bloggify.renderer.registerTemplate("bad-csrf-token", badCsrf || errorPages.badCsrf, null, true)
        Bloggify.server.errorPages(errorPages)
    }

    const paths = await fileTree(routesRoot)
    const uris = {
        /* "/path/to/route": { controllerPath, viewPath } */
    };

    const errorPages = {}
    const walk = (obj) => {
        if (!typpy(obj, Object)) { return }
        if (!obj.path && !obj.stat) {
            return forEach(obj, walk)
        }

        const parsed = path.parse(obj.path)
        const fileName = parsed.name
        const dir = parsed.dir
        const isController = parsed.ext === ".js"
        const relPath = path.normalize(dir).replace(path.normalize(routesRoot), "")
        const isIndex = fileName === "_" || fileName === "index"
        const uri = (relPath + "/" + (isIndex ? "" : fileName)).replace(/\_/g, ":").replace(/\\/g, "/")
        const controllerPath = path.resolve(dir, `${fileName}.js`)
        const cUri = setOrGet(uris, uri, {})

        if (isController) {
            cUri.controller = controllerPath
        } else {
            cUri.view = obj.path
        }
    }
    walk(paths)

    const ALL_METHODS = ["all"].concat(httpMethods)

    const allUris = Object.keys(uris)
    for (let i = 0; i < allUris.length; ++i) {
        let uri = allUris[i]
        const cUriMeta = uris[uri]
        let controller = null

        if (cUriMeta.controller) {
            controller = await import(cUriMeta.controller)
        }

        const hooks = {}
        if (typeof controller?.default === "function") {
            ALL_METHODS.forEach(c => hooks[c] = controller)
        } else {
            for (let key in controller) {
                hooks[key] = controller[key]
            }
            forEach(hooks, (fn, meth) => {
                if (ALL_METHODS.includes(meth)) { return }
                switch (meth) {
                    case "init":
                        // Those are special
                        break;
                    case "before":
                    case "after":
                    case "use":
                        Bloggify.server[meth](uri, fn)
                        break
                    default:
                        Bloggify.log(`In ${cUriMeta.controller} you configured a method ${meth}, but that's not a supported HTTP method.`, "warn")
                        break
                }
            })
        }

        let handler = null
        // View + Controller
        if (cUriMeta.controller && cUriMeta.view) {
            handler = async ctx => {
                let fn = hooks[ctx.method] || hooks.all
                if (typeof fn === "function") {
                    try {
                        let data = await fn(ctx)
                        if (data === false) { return }
                        data = data || {}
                        process.nextTick(() => {
                            data.forceTemplateName = true
                            Bloggify.render(ctx, cUriMeta.view, data)
                        })
                    } catch (error) {
                        error.status = error.status || error.statusCode || 500

                        const data = {
                            statusCode: error.status,
                            error,
                            forceTemplateName: true
                        }

                        if (error.status < 500) {
                            return Bloggify.render(ctx, cUriMeta.view, data)
                        }

                        Bloggify.log(error)
                        Bloggify.render(ctx, "500", data)
                    }
                } else {
                    Bloggify.render(ctx, cUriMeta.view)
                }
            }
        // Only controller (JSON output)
        } else if (cUriMeta.controller) {
            handler = async ctx => {
                let fn = hooks[ctx.method] || hooks.all
                if (typeof fn === "function") {
                    try {
                        const data = await fn(ctx)
                        if (data === false) { return }
                        const status = data && data.statusCode || 200
                        data && (delete data.statusCode)
                        ctx.end(data, status)
                    } catch (error) {
                        error.status = error.status || error.statusCode || 500

                        const data = {
                            statusCode: error.status
                            , error
                        }

                        if (error.status < 500) {
                            const res = {
                                message: error.message,
                                status: error.status,
                            }

                            if (error.code) {
                                res.code = error.code
                            }

                            if (error.metadata) {
                                res.metadata = error.metadata
                            }

                            ctx.end(res, data.statusCode)
                            return
                        }

                        Bloggify.log(error)
                        ctx.end({
                            message: Bloggify.production ? "Internal Server Error" : error.message
                        }, data.statusCode)
                    }
                } else {
                    ctx.end({
                        message: "Not Found"
                    }, 404)
                }
            }
        // Only view (HTML without dynamic data)
        } else if (cUriMeta.view) {
            handler = ctx => {
                Bloggify.render(ctx, cUriMeta.view)
            }
        }

        uri = uri.replace(/\\/g, "/")
        Bloggify.server.addPage(uri, handler)

        // Handle error pages
        if (cUriMeta.view) {
            const errorPage = ERROR_PAGES_PATHS[uri]
            if (errorPage) {
                errorPages[errorPage] = cUriMeta.view
            }
        }

        if (typeof controller?.init === "function") {
            controller.init(cUriMeta.controller);
        }
    }

    setUpErrorPages(errorPages)
}
