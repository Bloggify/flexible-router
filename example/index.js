"use strict";

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
