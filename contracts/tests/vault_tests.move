module move_yield_copilot::vault_tests {

  use std::signer;
  use move_yield_copilot::vault;

  /// Dummy coin type for testing
  struct TestCoin has store, drop, copy {}

  /// -----------------------------
  /// Test: Initialize Vault
  /// -----------------------------
  #[test(admin = @move_yield_copilot, user = @0x2)]
  public fun test_init_vault(admin: &signer) {
    vault::init_vault<TestCoin>(
      admin,
      100,   // 1% management fee
      1000   // 10% performance fee
    );

    let (assets, shares, strategy) =
      vault::get_vault_state<TestCoin>();

    assert!(assets == 0, 0);
    assert!(shares == 0, 1);
    assert!(strategy == 0, 2);
  }

  /// -----------------------------
  /// Test: Deposit Mints Shares
  /// -----------------------------
  #[test(admin = @move_yield_copilot, user = @0x2)]
  public fun test_deposit(admin: &signer, user: &signer) {
    vault::init_vault<TestCoin>(admin, 100, 1000);

    vault::deposit<TestCoin>(user, 1_000);

    let (assets, shares, _) =
        vault::get_vault_state<TestCoin>();

    assert!(assets == 1_000, 10);
    assert!(shares == 1_000, 11);
  }

  /// -----------------------------
  /// Test: Withdraw Burns Shares
  /// -----------------------------
  #[test(admin = @move_yield_copilot, user = @0x2)]
  public fun test_withdraw(admin: &signer, user: &signer) {
    vault::init_vault<TestCoin>(admin, 100, 1000);

    vault::deposit<TestCoin>(user, 1_000);
    vault::withdraw<TestCoin>(user, 500);

    let (assets, shares, _) =
        vault::get_vault_state<TestCoin>();

    assert!(assets == 500, 20);
    assert!(shares == 500, 21);
  }

  /// -----------------------------
  /// Test: Harvest + Performance Fee
  /// -----------------------------
  #[test(admin = @move_yield_copilot, user = @0x2)]
  public fun test_harvest_and_fees(admin: &signer, user: &signer) {
    vault::init_vault<TestCoin>(admin, 0, 1000); // 10% perf fee

    vault::deposit<TestCoin>(user, 1_000);

    vault::harvest<TestCoin>(admin, 1_000);
    vault::collect_fees<TestCoin>(admin);

    let (assets, _, _) =
        vault::get_vault_state<TestCoin>();

    assert!(assets == 1_900, 30);
  }

  /// -----------------------------
  /// Test: Switch Strategy
  /// -----------------------------
  #[test(admin = @0x1)]
  public fun test_switch_strategy(admin: &signer) {
    vault::init_vault<TestCoin>(admin, 100, 1000);

    vault::switch_strategy<TestCoin>(admin, 1);

    let (_, _, strategy) =
        vault::get_vault_state<TestCoin>();

    assert!(strategy == 1, 40);
  }
}
