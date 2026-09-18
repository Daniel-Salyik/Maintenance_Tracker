Feature: Bike Fleet Management
  As a cyclist, I want to maintain a digital garage of my bicycles
  so that I can track the specific maintenance needs of each bike separately.

  # --- Section 1: Adding Bikes ---

  Scenario: Successfully adding a new bike to the fleet
    Given a logged-in user with space in their garage
    When the user provides the following bike profile:
      | Field           | Value                |
      | Model Type      | Road Bike            |
      | Model Year      | 2023                 |
      | Frame Number    | FR123456789          |
      | Description     | My main racing bike  |
    And provides the following specifications:
      | Spec            | Value                |
      | Brake Type      | Disc                 |
      | Tire Width      | 25mm                 |
      | User Weight     | 75kg                 |
      | Number of Speeds | 12                   |
      | Shifting Type   | Electronic           |
    And clicks the "Save Bike" button
    Then the bike should be successfully added to the fleet
    And the user should see the bike listed in their garage

  Scenario Outline: Preventing the addition of a bike with missing required data
    Given a logged-in user
    When the user attempts to save a bike without a "<Field>"
    Then the system should prevent the save
    And display an error: "<Error>"

    Examples:
      | Field        | Error                                     |
      | Frame Number | Frame Number is required for registration |
      | Model Type   | Model Type is required for registration   |
      | Model Year   | Model Year is required for registration   |

  Scenario Outline: Rejecting a Tire Width outside the valid range
    Given a logged-in user
    When the user attempts to save a bike with a "Tire Width" of "<Width>"
    Then the system should prevent the save
    And display an error: "Tire Width must be between 19mm and 60mm"

    Examples:
      | Width |
      | 0mm   |
      | 18mm  |
      | 61mm  |

  Scenario Outline: Accepting a Tire Width at the boundary of the valid range
    Given a logged-in user with space in their garage
    When the user attempts to save a bike with a "Tire Width" of "<Width>"
    Then the bike should be successfully added to the fleet

    Examples:
      | Width |
      | 19mm  |
      | 60mm  |

  # --- Section 2: Capacity Limits ---

  Scenario: Enforcing the maximum limit of 3 bikes
    Given a user already has 3 bikes in their garage
    When the user attempts to add a 4th bike
    Then the system should block the addition
    And display an error message "You can only track up to 3 bikes"
    And the total bike count should remain at 3

  Scenario: Freeing up a slot after deletion
    Given a user has the maximum limit of 3 bikes
    When the user deletes one of their bikes
    And the user attempts to add a new bike
    Then the system should successfully allow the addition
    And the total bike count should return to 3

  # --- Section 3: Managing Existing Bikes ---

  Scenario: Updating bike specifications
    Given a bike exists in the user's fleet with "Tire Width" set to "25mm"
    When the user updates the "Tire Width" to "28mm" in the bike settings
    And saves the changes
    Then the bike's profile should reflect the new width of "28mm"

  Scenario: Updating a bike's profile field
    Given a bike named "Old Commuter" exists in the user's fleet
    When the user updates the "Description" to "Retired, garage queen" in the bike settings
    And saves the changes
    Then the bike's profile should reflect the new description of "Retired, garage queen"

  Scenario: Deleting a bike from the fleet
    Given a bike named "Old Commuter" exists in the user's fleet
    When the user selects "Delete Bike" for the "Old Commuter"
    And confirms the deletion in the pop-up dialog
    Then the "Old Commuter" should no longer appear in the garage
    And the user's available bike slots should increase by one

  Scenario: Preventing an update to a bike that was already deleted in another tab
    Given a bike named "Removed Bike" exists in the user's fleet
    And the bike has since been deleted in another tab
    When the user attempts to update the "Removed Bike" via their stale page
    Then the system should return a "404" error

  Scenario: Preventing a repeated deletion of a bike that was already deleted in another tab
    Given a bike named "Removed Bike" exists in the user's fleet
    And the bike has since been deleted in another tab
    When the user attempts to delete the "Removed Bike" again via their stale page
    Then the system should return a "404" error

  # --- Section 4: Listing and Viewing ---

  Scenario: Viewing an empty garage
    Given a logged-in user with an empty garage
    When the user opens their garage
    Then the garage should show 0 bikes

  Scenario: Viewing the garage with multiple bikes
    Given a logged-in user with 2 bikes in their garage
    When the user opens their garage
    Then the garage should show 2 bikes

  Scenario: Viewing a single bike's full profile
    Given a bike named "Weekend Cruiser" exists in the user's fleet
    When the user opens the profile for "Weekend Cruiser"
    Then the profile should include the bike's full profile and specifications

  # --- Section 5: Security & Isolation ---

  Scenario: Blocking access to another user's bike by direct URL
    Given User A has a bike named "Race Bike"
    And User B has a bike named "Commuter"
    When User B attempts to access the bike profile of "Race Bike" via a direct URL
    Then the system should return a "403" or "404" error
    And User B should not be able to see any data belonging to User A

  Scenario: Blocking an update to another user's bike
    Given User A has a bike named "Race Bike"
    And User B has a bike named "Commuter"
    When User B attempts to update the bike profile of "Race Bike" via a direct URL
    Then the system should return a "403" or "404" error

  Scenario: Blocking a deletion of another user's bike
    Given User A has a bike named "Race Bike"
    And User B has a bike named "Commuter"
    When User B attempts to delete the bike profile of "Race Bike" via a direct URL
    Then the system should return a "403" or "404" error

  Scenario Outline: Rejecting unauthenticated bike actions
    When an unauthenticated user attempts to <Action> a bike
    Then the system should return a "401" error

    Examples:
      | Action |
      | view   |
      | add    |
      | update |
      | delete |
