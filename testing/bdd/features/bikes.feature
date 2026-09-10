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

  Scenario: Preventing the addition of a bike without required data
    Given a logged-in user
    When the user attempts to save a bike without a "Frame Number"
    Then the system should prevent the save
    And display an error: "Frame Number is required for registration"

  # --- Section 2: Capacity Limits ---

  Scenario: Enforcing the maximum limit of 3 bikes
    Given a user already has 3 bikes in their garage
    When the user attempts to add a 4th bike
    Then the system should block the addition
    And display an error message "You can only track up to 3 bikes"

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
    And the change should be persisted in the database

  Scenario: Deleting a bike from the fleet
    Given a bike named "Old Commuter" exists in the user's fleet
    When the user selects "Delete Bike" for the "Old Commuter"
    And confirms the deletion in the pop-up dialog
    Then the "Old Commuter" should no longer appear in the garage
    And the user's available bike slots should increase by one
