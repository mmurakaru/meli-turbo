## Getting started

```bash
npm install meli.js
```

Simply `import meli from 'meli.js'` and use it.

Authenticated user eg. tours in your dashboard:

```js
import userflow from "userflow.js";

meli.start("MELI_TOKEN");
meli.auth("USER_ID", {
  name: "USER_NAME",
  email: "USER_EMAIL",
  signed_up_at: "USER_SIGNED_UP_AT",
});
```

Unauthenticated user eg. tours on your public site:

```js
meli.public();
```

You can find your Meli.js Token in Meli under [Workspace settings -> Environments](https://www.meli-ai.com/dashboard/workspace).

Check out the [installation instructions](https://userflow.com/docs/dev/userflow-js-installation) for more info.

# Add styles & script to the head of your application

```bash
  <link rel="stylesheet" href="https://tour-meli-ai.vercel.app/bundle.min.css" />
  <script defer>
      window.tourMeli = window.tourMeli || {};
      window.tourMeli.scriptUrl = 'https://tour-meli-ai.vercel.app/bundle.min.js';
      window.tourMeli.configUrl = 'https://meli-ai.com/api/tours/:id';

      (function(w, d, s, c) {
        var script = d.createElement('script');
        script.src = s;
        script.async = true;
        script.onload = () => w.initProductTour(c);
        d.head.appendChild(script);
      })(window, document, window.tourMeli.scriptUrl, window.tourMeli.configUrl);
  </script>
```
