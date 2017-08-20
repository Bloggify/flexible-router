## Documentation

You can see below the API reference of this module.

### Plugin Configuration

- **Object** `config`:
 - `routes_dir` (String): The path to the directory where the routes are stored. They should be randable view files. For dynamic routes, use the `_`character.
 - `controllers_dir` (String): The path to the controllers directory.
 - `error_pages` (Object): The error pages template names.
     - `404` (String): The path to the `404` error page.
     - `500` (String): The path to the `500` error page.
     - `bad_csrf` (String): The path the template that should be rendered when a bad CSRF token is sent to the server.

