
# bloggify-flexible-router

 [![Version](https://img.shields.io/npm/v/bloggify-flexible-router.svg)](https://www.npmjs.com/package/bloggify-flexible-router) [![Downloads](https://img.shields.io/npm/dt/bloggify-flexible-router.svg)](https://www.npmjs.com/package/bloggify-flexible-router)

> A flexible router for Bloggify apps.

## :cloud: Installation

```sh
$ npm i --save bloggify-flexible-router
```


## :clipboard: Example



```js
const bloggifyFlexibleRouter = require("bloggify-flexible-router");

console.log(bloggifyFlexibleRouter());
```

## :memo: Documentation


### Plugin Configuration

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
