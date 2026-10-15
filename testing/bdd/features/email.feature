Feature: Transactional Emails
  As a cyclist, I want to receive emails about my account
  so that I know my registration worked and I can recover my password.

  # Tags: @api   = proven by the supertest steps in testing/bdd/steps.
  #       @email = also reads the sent mail from Mailpit (docker compose up -d mailpit).
  # Emails are sent in the background, so the steps wait a few seconds for delivery.

  # --- Section 1: Registration email ---

  @api @email
  Scenario: Successful registration sends a welcome email
    Given a new user provides a valid email "newrider@example.com" and a strong password
    When they submit the registration form
    Then a welcome email should be delivered to "newrider@example.com"

  @api @email
  Scenario: Failed registration sends no email
    Given a new user provides a valid email "weakpass@example.com" and a weak password "123"
    When they submit the registration form
    Then they should see a registration error message "Password does not meet strength requirements"
    And no email should be delivered to "weakpass@example.com"

  @api @email
  Scenario: Registration with an invalid email format sends no email
    Given a new user provides an invalid email "not-an-email" and a strong password
    When they submit the registration form
    Then they should see a registration error message "Invalid email format"
    And no email should have been delivered at all

  @api @email
  Scenario: Registration with an already-registered email does not send a second email
    Given a registered user exists with email "duplicate@example.com" and password "SecurePass123"
    When a new user provides a valid email "duplicate@example.com" and a strong password
    And they submit the registration form
    Then they should see a registration error message "Email already in use"
    And only one email should have been delivered to "duplicate@example.com"

  # --- Section 2: Forgot password email ---

  @api @email
  Scenario: Forgot password sends a reset email with a reset link
    Given a registered user exists with email "cyclist@example.com" and password "SecurePass123"
    When the user requests a password reset for "cyclist@example.com"
    Then they should see a reset confirmation message "If an account exists, a reset link has been sent."
    And a password reset email should be delivered to "cyclist@example.com"
    And the reset email should contain a reset link

  @api @email
  Scenario: Forgot password for an unknown email gives the same answer and sends nothing
    Given no registered user exists with email "ghost@example.com"
    When the user requests a password reset for "ghost@example.com"
    Then they should see a reset confirmation message "If an account exists, a reset link has been sent."
    And no email should be delivered to "ghost@example.com"

  @api @email
  Scenario: Forgot password with a malformed email gives the same answer and sends nothing
    When the user requests a password reset for "not-an-email"
    Then they should see a reset confirmation message "If an account exists, a reset link has been sent."
    And no email should have been delivered at all

  @api @email
  Scenario: Forgot password with an empty email is rejected
    When the user requests a password reset for ""
    Then they should see a reset error message "Email is required"
    And no email should have been delivered at all
