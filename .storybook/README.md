# Varbase Storybook Integration

## Steps to have a working Storybook for Varbase

* Change `varbase.local`in the `package.json` file to the working local or development domain name.
* Replace `http://varbase.local` in the `preview.js` file with the project's base URL, or an environment variable to the local or development domain.
* Open a command terminal window.
* Change directory to the project.
* Run `yarn install` in the terminal.
* Run `yarn storybook` to build.
* The default browser will open with the list of Default Varbase Components in the Storybook.


## Customize Varbase Storybook for a project
* Uncomment and change `// mytheme: {title: 'My Custom Theme for a Project'}` in the `.storybook/preview.js` file 
* Uncomment the following line to start listing components Vartheme BS5 Starterkit.
`"../docroot/themes/contrib/vartheme_ba5/components/**/*.stories.@(json|yml)",` in the `.storybook/main.js` file  
* Uncomment and change `"../docroot/themes/custom/mytheme/components/**/*.stories.@(json|yml)",` in the `.storybook/main.js` file.
 to start listing components from custom cloned generated theme
* Uncomment and change `"../docroot/modules/custom/my_custom_module/components/**/*.stories.@(json|yml)",` in the `.storybook/main.js` file to start listing components from custom modules


## More info
>  In the `main.js` file:
> Only when needed add the [dark](https://github.com/twbs/bootstrap/blob/v5.3.0/dist/css/bootstrap.css#L127) `data-bs-theme="dark"` to the body the inner iframe in the canvas.
> The default is [light](https://github.com/twbs/bootstrap/blob/v5.3.0/dist/css/bootstrap.css#L8) `data-bs-theme="light"`
> **Color modes:**
> **Bootstrap now supports color modes**, or themes, as of **v5.3.0**.
> Explore our default light color mode and the new dark mode,
> or create your own using our styles as your template.
> [https://getbootstrap.com/docs/5.3/customize/color-modes/](https://getbootstrap.com/docs/5.3/customize/color-modes/)

## Related Integration Issues
* [Integrate Varbase Project with Storybook using Component Libraries: Theme Server for Varbase Components and Vartheme BS5 with and Bootstrap 5.3.0 #182](https://github.com/Vardot/varbase-project/issues/182)
* [#3372551: Integrate Varbase Components with Storybook using Component Libraries: Theme Server and Bootstrap 5.3.0](https://www.drupal.org/project/varbase_components/issues/3372551)
* [#3372546: Integrate Vartheme BS5 with Storybook using Component Libraries: Theme Server for Varbase Components](https://www.drupal.org/project/vartheme_bs5/issues/3372546)