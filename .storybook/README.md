# Integration of Varbase with Storybook

**Varbase** has been integrated with [**Storybook**](https://storybook.js.org/) to provide a listing of stories for [**Single Directory Components (SDC)**](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components) components. This integration allows for easier development and testing of [**Varbase Components**](https://www.drupal.org/project/varbase\_components).

## Steps to Set up a Working Storybook for Varbase

* Enable the **`cl_server`** module on the site either through the site's interface or by running the command `./bin/drush en cl_server` with Drush. Note that the CL Server module should not be kept running on a production site.
* Navigate to **`"/admin/people/permissions/module/cl_server"`**  to give the `Use the CL Server endpoint` permission to all user roles. Check the  `Anonymous user` and `Authenticated user` checkbox and press **`Save permission`** submit button


>
> **Use the CL Server endpoint**
> _**Warning:** Give to trusted roles only; this permission has security implications
> Allows a user to access the Component Library: Server endpoint
> 

* Add the following exclude of modules to the `settings.php` or `settings.local.php` only to the development environment:

```php
# Disable caches during development. This allows finding new components without clearing caches.
// $settings['cache']['bins']['component_registry'] = 'cache.backend.null';
# Then disallow exporting config for 'cl_server'. Instructions are at the bottom of the file.
$settings['config_exclude_modules'] = ['devel', 'stage_file_proxy', 'cl_server'];
```

* Change the following Cross-Site HTTP requests (CORS) in the `services.yml` or `development.services.yml` file.


```yaml
  cors.config:
    enabled: true
    # Specify allowed headers, like 'x-allowed-header'.
    allowedHeaders: ['*']
    # Specify allowed request methods, specify ['*'] to allow all possible ones.
    allowedMethods: []
    # Configure requests allowed from specific origins. Do not include trailing
    # slashes with URLs.
    allowedOrigins: ['*']
    # Sets the Access-Control-Expose-Headers header.
    exposedHeaders: false
    # Sets the Access-Control-Max-Age header.
    maxAge: false
    # Sets the Access-Control-Allow-Credentials header.
    supportsCredentials: true
```


* Enable Twig debugging by `debug: true`  in the `services.yml` or `development.services.yml` file.


> Enabling Twig debugging is not recommended in production environments.


* Disable the Twig cache by `cache: false`  in the `services.yml` or `development.services.yml` file.


> Disabling the Twig cache is not recommended in production environments.



> **Set up Storybook for your Drupal site.**
> 
> Please see the [@lullabot/storybook-drupal-addon](https://www.github.com/lullabot/storybook-drupal-addon#readme), which will make your Storybook aware of Drupal by connecting it to this module.
> 
>  [📋 Step-by-step tutorial 📋](https://git.drupalcode.org/project/cl\_server/-/blob/2.x/docs/storybook.md)
> 

* Change `varbase.local` in the **`package.json`** file to the appropriate local or development domain name.
* Replace `http://varbase.local` in the **`preview.js`** file with the base URL of your project or an environment variable representing the local or development domain.
* Open a command terminal window and navigate to your project's directory.
* Run the command **`yarn install`** in the terminal to install the necessary dependencies.
* Run the command **`yarn storybook:dev`** to build the **Storybook**.
* The default browser will open, displaying the list of Default Varbase Components in the Storybook.

## Customizing Varbase Storybook for a Project:

### **Switching Between Themes**

To showcase a custom cloned generated theme, uncomment and modify the following line in the **`.storybook/preview.js`** file:

&#x20;`// mytheme: {title: 'My Custom Theme for a Project'}`&#x20;

### **Show Custom Vartheme BS5's Components**

To include components from **Vartheme BS5 Starterkit**, uncomment and modify the following line in the `.storybook/main.js` file:\
`"../docroot/themes/contrib/vartheme_ba5/components/**/*.stories.@(json|yml)",`

### Show Custom Theme's Components

In case of having a custom theme for a project by


To include components from a custom cloned generated theme, uncomment and modify the following line in the `.storybook/main.js` file:

`"../docroot/themes/custom/mytheme/components/**/*.stories.@(json|yml)",`


> Please ensure that the path to the custom theme is correct. It should be located either in `"../docroot/themes"` or `"../docroot/themes/custom"`


### Show Custom Module's Components

To include components from a custom module, uncomment and modify the following line in the `.storybook/main.js` file:

`"../docroot/modules/custom/my_custom_module/components/**/*.stories.@(json|yml)",`

## More Information About Bootstrap 5.3.0 Theme Color Modes


> In the `` main.js` `` file:\
> 
> 
> * Add the attribute `data-bs-theme='dark'` to the body tag of the inner iframe in the canvas only when necessary. The default value is `data-bs-theme='light'`.
> * Bootstrap now supports color modes, or themes, starting from version **5.3.0.** You can explore the default light color mode and the new dark mode, or create your own theme using Bootstrap's styles as a template.\
>   [https://getbootstrap.com/docs/5.3/customize/color-modes/](https://getbootstrap.com/docs/5.3/customize/color-modes/)
> *
> 
> 

## Related Integration Issues

* [Integrate Varbase Project with Storybook using Component Libraries: Theme Server for Varbase Components and Vartheme BS5 with and Bootstrap 5.3.0 #182](https://github.com/Vardot/varbase-project/issues/182)
* [#3372551: Integrate Varbase Components with Storybook using Component Libraries: Theme Server and Bootstrap 5.3.0](https://www.drupal.org/project/varbase\_components/issues/3372551)
* [#3372546: Integrate Vartheme BS5 with Storybook using Component Libraries: Theme Server for Varbase Components](https://www.drupal.org/project/vartheme\_bs5/issues/3372546)