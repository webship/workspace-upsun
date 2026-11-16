Feature: The Upsun plugin on a project row
  Once the plugin is activated and installed, every site row carries the UPSUN menu, and the Plugins
  page lists the plugin with its four steps.

  @needs-project-dev
  Scenario: A site row offers the UPSUN menu, captioned with its link state
    Given I am on "/dev"
     Then the element ".act-menu-upsun" should be displayed
      And I should see "UPSUN"
      And the element ".act-menu-upsun + .act-status" should be displayed

  @needs-project-dev
  Scenario: An unlinked project's menu opens and says how to link it
    Given I am on "/dev"
      And I click on the element ".project-row .act-menu-upsun button"
     Then ".uk-dropdown.uk-open" should be visible
      And I should see "Link and environments"

  # The Plugins page names each plugin; the package is on the plugin's own page (the row shows it on hover only).
  Scenario: The plugin is listed on the Plugins page, and its own page names its package
    Given I am on "/settings/plugins"
     Then I should see "Upsun"
     When I go to "/settings/plugin/upsun"
     Then I should see "@webship.co/workspace-upsun"

  # The AI folders are searched by name: with every plugin on, a folder lists more than one page of items.
  Scenario: The AI Agents folder lists the agent the plugin ships
    Given I am on "/ai-agents?q=upsun-deployer"
     Then I should see "upsun-deployer"

  Scenario: The AI Skills folder lists the skill the plugin ships
    Given I am on "/ai-skills?q=upsun-hosting"
     Then I should see "upsun-hosting"

  Scenario: The AI Commands folder lists the command the plugin ships
    Given I am on "/ai-commands?q=upsun-status"
     Then I should see "upsun-status"

  Scenario: The AI Prompts folder lists the prompt the plugin ships
    Given I am on "/ai-prompts?q=upsun-test-then-deploy"
     Then I should see "upsun-test-then-deploy"
