## Run the app (dashboard) locally

0. get the env file from @samuelstroschein
1. make sure the database is running
2. in dashboard: `npm install`
3. in dashboard: `npm run dev`
4. Open [localhost:3000](http://localhost:3000)
5. if you have to sign in, goto [http://localhost:3000/auth/dev-login](http://localhost:3000/auth/dev-login)

## Get eslint warnings

See [this](https://github.com/sveltejs/eslint-plugin-svelte3/blob/master/INTEGRATIONS.md) as of October 2021:

1. Open the `settings.json` file from VSCode (eslint)
2. Add

```JSON
"eslint.validate": [
    "javascript",
    "javascriptreact",
    "svelte"
  ]
```

## Structure of the app

The app is developed with [SvelteKit](https://kit.svelte.dev/), [CarbonComponents](https://carbon-svelte.vercel.app/) and [TailwindCSS](https://tailwindcss.com/).
Most questions should be answered by reading the documentation of either one of them.
