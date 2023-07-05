# Varbase Storybook Integration

**Varbase** was integrated to list stories for **Single Directory Components (SDC)** components, from [**Varbase Components**](https://www.drupal.org/project/varbase\_components)**,** [**Vartheme BS5**](https://www.drupal.org/project/vartheme\_bs5) in a [**Storybook**](https://storybook.js.org)**.**

## Steps to have a working Storybook for Varbase

* Change `varbase.local` in the `package.json` file to the working local or development domain name.
* Replace `http://varbase.local` in the `preview.js` file with the project's base URL, or an environment variable to the local or development domain.
* Open a command terminal window.
* Change directory to the project.
* Run `yarn install` in the terminal.
* Run `yarn storybook` to build.
* The default browser will open with the list of Default **Varbase Components** in the **Storybook**.

## Customize Varbase Storybook for a Project

### **Switching Between Themes**

Show custom cloned generated theme, by un-commenting and changing the following line

&#x20;`// mytheme: {title: 'My Custom Theme for a Project'}`&#x20;

in the `.storybook/preview.js` file.&#x20;

## **Show Custom Vartheme BS5's Components**

Start listing components from **Vartheme BS5 Starterkit**, by un-commenting and changing the following line\
`"../docroot/themes/contrib/vartheme_ba5/components/**/*.stories.@(json|yml)",`

in the `.storybook/main.js` file.

### Show Custom Theme**'s Components**

Start listing components from a custom cloned generated theme, by un-commenting and changing the following line

`"../docroot/themes/custom/mytheme/components/**/*.stories.@(json|yml)",`&#x20;

in the `.storybook/main.js` file.

### Show Custom Module**'s Components**

Start listing components from a custom module, by un-commenting and changing the following line.

`"../docroot/modules/custom/my_custom_module/components/**/*.stories.@(json|yml)",`&#x20;

in the `.storybook/main.js` file to&#x20;

## More Information About Bootstrap 5.3.0 Theme Color Modes

> In the `main.js` file:\
> Only when needed add the [dark](https://github.com/twbs/bootstrap/blob/v5.3.0/dist/css/bootstrap.css#L127) `data-bs-theme="dark"` to the body the inner iframe in the canvas.\
> The default is [light](https://github.com/twbs/bootstrap/blob/v5.3.0/dist/css/bootstrap.css#L8) `data-bs-theme="light"`\
> **Color modes:**\
> **Bootstrap now supports color modes**, or themes, as of **v5.3.0**.\
> Explore our default light color mode and the new dark mode,\
> or create your own using our styles as your template.\
> [https://getbootstrap.com/docs/5.3/customize/color-modes/](https://getbootstrap.com/docs/5.3/customize/color-modes/)

## Related Integration Issues

* [Integrate Varbase Project with Storybook using Component Libraries: Theme Server for Varbase Components and Vartheme BS5 with and Bootstrap 5.3.0 #182](https://github.com/Vardot/varbase-project/issues/182)
* [#3372551: Integrate Varbase Components with Storybook using Component Libraries: Theme Server and Bootstrap 5.3.0](https://www.drupal.org/project/varbase\_components/issues/3372551)
* [#3372546: Integrate Vartheme BS5 with Storybook using Component Libraries: Theme Server for Varbase Components](https://www.drupal.org/project/vartheme\_bs5/issues/3372546)