Feature: The Upsun plugin on a project row
  Once the plugin is activated and installed, every site row carries the UPSUN menu, and the Plugins
  page lists the plugin with its four steps.

  Scenario: A site row offers the UPSUN menu, captioned with its link state
    Given I am on "/dev"
     Then the element ".act-menu-upsun" should be displayed
      And I should see "UPSUN"
      And the element ".act-menu-upsun + .act-status" should be displayed

  Scenario: An unlinked project's menu opens and says how to link it
    Given I am on "/dev"
      And I click on the element ".project-row .act-menu-upsun button"
     Then ".uk-dropdown.uk-open" should be visible
      And I should see "Link and environments"

  Scenario: The plugin is listed on the Plugins page
    Given I am on "/settings/plugins"
     Then I should see "Upsun"
      And I should see "@webship.co/workspace-upsun"

  Scenario: The AI Agents folder lists the agent the plugin ships
    Given I am on "/ai-agents"
     Then I should see "upsun-deployer"

  Scenario: The AI Skills folder lists the skill the plugin ships
    Given I am on "/ai-skills"
     Then I should see "upsun-hosting"

  Scenario: The AI Commands folder lists the command the plugin ships
    Given I am on "/ai-commands"
     Then I should see "upsun-status"

  Scenario: The AI Prompts folder lists the prompt the plugin ships
    Given I am on "/ai-prompts"
     Then I should see "upsun-test-then-deploy"
