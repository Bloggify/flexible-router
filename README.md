
# bloggify-flexible-router

 [![Version](https://img.shields.io/npm/v/bloggify-flexible-router.svg)](https://www.npmjs.com/package/bloggify-flexible-router) [![Downloads](https://img.shields.io/npm/dt/bloggify-flexible-router.svg)](https://www.npmjs.com/package/bloggify-flexible-router)

> A flexible router for Bloggify apps.

## :cloud: Installation

```sh
$ npm i --save bloggify-flexible-router
```


## :memo: Documentation


### `bloggify:init(config)`
If the routes (default: `app/routes`) folder exists, it will dictate the routes structure. For example:

`_` is alias for `index`. `_foo` is alias for `:foo`

```
routes/
├── 404.ajs                    << 404 page
├── _.ajs                      << The index page (loaded on `/`)
├── api                        << Rest API (`/api`)
│   ├── index.js               << Api Handlers (e.g. sending a custom 404)
│   └── users                  << The `/api/users[/...]` endpoint
│       ├── index.js           << Handling `/api/users` (sending the list of users)
│       └── _username          << Handling `/api/users/:username`
│           └── index.js       << Fetching the user, by username, and sending it
└── users                      << The users list, in HTML format (`/users`)
    ├── _.ajs                  << The `/users` view
    ├── _.js                   << The `/users` controler
    └── _user                  << `/users/:user` endpoint
        ├── _.ajs              << View
        └── _.js               << Controller
```

The controller files look like this:

```js
// Before hook
exports.before = (ctx, cb) => ...

// After hook
exports.after = (ctx, cb) => ...

// Handle all the methods
// Alias for module.exports = ctx => ...
exports.all = ctx => ...

// Handle post requests
exports.post = ctx => ...
```

#### Params
- **Object** `config`:
 - `routes_dir` (String): The path to the directory where the routes are stored. They should be randable view files. For dynamic routes, use the `_`character.

"/path/to/route": { controllerPath, viewPath }



## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :dizzy: Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:


 - [`bloggify`](https://github.com/Bloggify/Bloggify) (by Bloggify)—We make publishing easy.
 - [`bloggify-custom-app-template`](https://github.com/BloggifyTutorials/custom-app#readme)—A custom application built with @Bloggify.

## :scroll: License

[MIT][license] © [Bloggify][website]

[license]: http://showalicense.com/?fullname=Bloggify%20%3Csupport%40bloggify.org%3E%20(https%3A%2F%2Fbloggify.org)&year=2017#license-mit
[website]: https://bloggify.org
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
