<?php

/**
 * @file
 * Seed a user-owned Content Kanban activity log for the Content Planner tests.
 *
 * The Content Planner dashboard "Recent Kanban Activities" widget only renders
 * when there is at least one Content Kanban log owned by a real (non-anonymous)
 * user: content_kanban logs a moderation transition with the CURRENT user as
 * the owner, and KanbanLogService::getRecentLogs() excludes anonymous owners.
 *
 * Run in the CI before_script AFTER varbase_content_planner is enabled:
 *   drush php:script tests/scripts/seed_content_planner_activity.php
 */

use Drupal\node\Entity\Node;

// Own the moderation transition (and therefore the Kanban log) as user 1 so it
// is not filtered out as an anonymous activity.
$account_switcher = \Drupal::service('account_switcher');
$user = \Drupal::entityTypeManager()->getStorage('user')->load(1);
$account_switcher->switchTo($user);

// Create a moderated Basic page and transition it draft -> published. The
// "page" bundle is under the varbase_simple_workflow content-moderation
// workflow, so saving the transition fires content_kanban_entity_presave().
$node = Node::create([
  'type' => 'page',
  'title' => 'Content Planner Kanban Activity',
  'uid' => 1,
  'moderation_state' => 'draft',
]);
$node->save();
$node->set('moderation_state', 'published');
$node->setNewRevision(TRUE);
$node->save();

$account_switcher->switchBack();
