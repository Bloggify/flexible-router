## Documentation

You can see below the API reference of this module.

### Plugin Configuration

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

- **Object** `config`:
 - `routes_dir` (String): The path to the directory where the routes are stored. They should be randable view files. For dynamic routes, use the `_`character.

"/path/to/route": { controllerPath, viewPath }

