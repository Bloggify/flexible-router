
# bloggify-flexible-router

 [![Version](https://img.shields.io/npm/v/bloggify-flexible-router.svg)](https://www.npmjs.com/package/bloggify-flexible-router) [![Downloads](https://img.shields.io/npm/dt/bloggify-flexible-router.svg)](https://www.npmjs.com/package/bloggify-flexible-router)

> A flexible router for Bloggify apps.

## :cloud: Installation

```sh
$ npm i --save bloggify-flexible-router
```


## :clipboard: Example



```js
// Config
{
    "bloggify-flexible-router": {
        "controllers_dir": "app/controllers",
        "routes_dir": "app/routes",
        "error_pages": {
            "404": "404.ajs",
            "500": "500.ajs",
            "bad_csrf": "422.ajs"
        }
    }
}

// The app/routes contains:
// ├── 404.ajs
// ├── 422.ajs
// ├── 500.ajs
// └── users
//     └── _user
//         └── index.ajs

// The app/controllers contain the controllers. For instance, app/users/_user/index.js would look like this:
const USERS = {
    "Alice": {
        name: "Alice"
      , location: "Earth"
    }
};

exports.get = (lien, cb) => {
    const user = USERS[lien.params.user];

    // End with a 404 if the user is not found
    if (!user) {
        return lien.next();
    }

    // Pass the data to the template
    cb(null, {
        user
    });
};
```

## :question: Get Help

There are few ways to get help:

 1. Please [post questions on Stack Overflow](https://stackoverflow.com/questions/ask). You can open issues with questions, as long you add a link to your Stack Overflow question.
 2. For bug reports and feature requests, open issues. :bug:
 3. For direct and quick help from me, you can [use Codementor](https://www.codementor.io/johnnyb). :rocket:


## :memo: Documentation


### `bloggify:init(config)`

#### Params
- **Object** `config`:
 - `routes_dir` (String): The path to the directory where the routes are stored. They should be randable view files. For dynamic routes, use the `_`character.
 - `controllers_dir` (String): The path to the controllers directory.
 - `error_pages` (Object): The error pages template names.
     - `404` (String): The path to the `404` error page.
     - `500` (String): The path to the `500` error page.
     - `bad_csrf` (String): The path the template that should be rendered when a bad CSRF token is sent to the server.



## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :dizzy: Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:


 - [`bloggify-custom-app-template`](https://github.com/BloggifyTutorials/custom-app#readme)—A custom application built with @Bloggify.

## :scroll: License

[MIT][license] © [Bloggify][website]

[license]: http://showalicense.com/?fullname=Bloggify%20%3Csupport%40bloggify.org%3E%20(https%3A%2F%2Fbloggify.org)&year=2017#license-mit
[website]: https://bloggify.org
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
