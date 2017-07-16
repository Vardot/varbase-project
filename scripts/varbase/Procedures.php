<?php
/**
 * @file
 * Contains \Vardot\Varbase\Procedures.
 */

namespace Vardot\Varbase;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Yaml\Yaml;

/**
 * Varbase build default procedures and script handler.
 */
class Procedures {

  /**
   * Get the Drupal root directory.
   *
   * @param type $project_root
   * @return type
   */
  protected static function getDrupalRoot($project_root) {
    return $project_root . '/docroot';
  }
 
  /**
   * Post Drupal Scaffold Procedure.
   *
   * @param \Composer\EventDispatcher\Event $event
   *   The script event.
   */
  public static function postDrupalScaffoldProcedure(\Composer\EventDispatcher\Event $event) {
    
    $fs = new Filesystem();
    $root = static::getDrupalRoot(getcwd());

    if ($fs->exists($root . '/profiles/varbase/src/assets/robots-staging.txt')) {
      // Create staging robots file.
      copy($root . '/profiles/varbase/src/assets/robots-staging.txt', $root . '/robots-staging.txt');
    }
    
    if ($fs->exists($root . '/.htaccess')
      && $fs->exists($root . '/profiles/varbase/src/assets/htaccess_extra')) {

      // Alter .htaccess file.
      $htaccess_path = $root . '/.htaccess';
      $htaccess_lines = file($htaccess_path);
      $lines = [];
      foreach ($htaccess_lines as $line) {
        $lines[] = $line;
        if (strpos($line, "RewriteEngine on") !== FALSE) {
          $lines = array_merge($lines, file($root . '/profiles/varbase/src/assets/htaccess_extra'));
        }
      }
      file_put_contents($htaccess_path, $lines);
    }

    if ($fs->exists($root . '/profiles/varbase/src/assets/development.services.yml')) {
      // Alter development.services.yml to have Varbase's Local development services.
      copy($root . '/profiles/varbase/src/assets/development.services.yml', $root . '/sites/development.services.yml');
    }

    // Copy ACE librarary into /modules/contrib/ace_editor/libraries.
    if ($fs->exists($root . '/profiles/varbase/libraries/ace/src-min-noconflict/ace.js')) {
      mkdir($root . '/profiles/varbase/modules/contrib/ace_editor/libraries', 0777, true);
      rename($root . '/profiles/varbase/libraries/ace', $root . '/profiles/varbase/modules/contrib/ace_editor/libraries/ace');
    }
  }
  
}