module move_yield_copilot::vault {

  use std::signer;
  use std::string;
  use std::vector;
  use std::option::{Self, Option};
  use aptos_framework::coin;
  // use aptos_framework::timestamp;

  /// -----------------------------
  /// Errors
  /// -----------------------------
  const E_NOT_AUTHORIZED: u64 = 1;
  const E_INVALID_AMOUNT: u64 = 2;
  const E_INSUFFICIENT_SHARES: u64 = 3;
  const E_STRATEGY_NOT_FOUND: u64 = 4;
  const E_VAULT_NOT_FOUND: u64 = 99;

  /// -----------------------------
  /// Enums
  /// -----------------------------
  const RISK_LOW: u8 = 0;
  const RISK_MEDIUM: u8 = 1;
  const RISK_HIGH: u8 = 2;

  const STRATEGY_STABLE_SAFE: u8 = 0;
  const STRATEGY_MOVE_LONG: u8 = 1;

  /// Vault lives at publisher address
  const VAULT_ADMIN: address = @move_yield_copilot;


  /// -----------------------------
  /// Strategy Metadata
  /// -----------------------------
  struct StrategyMetadata has copy, drop, store {
    id: u8,
    name: string::String,
    risk_level: u8,
    description: string::String,
    management_fee_bps: u64,
    performance_fee_bps: u64,
  }

  /// -----------------------------
  /// Vault State
  /// -----------------------------
  struct Vault<phantom T> has key {
    total_assets: u64,
    total_shares: u64,

    /// current active strategy
    active_strategy: u8,

    /// accumulated profits since last harvest
    pending_profit: u64,

    /// fees
    mgmt_fee_bps: u64,
    perf_fee_bps: u64,

    /// last fee timestamp
    // last_fee_ts: u64,

    /// strategy registry
    strategies: vector<StrategyMetadata>,
  }

  /// -----------------------------
  /// User Position
  /// -----------------------------
  struct Position has key {
      shares: u64,
  }

  /// -----------------------------
  /// Admin Checker
  /// -----------------------------
  fun assert_admin(admin: &signer) {
    assert!(
      signer::address_of(admin) == VAULT_ADMIN,
      E_NOT_AUTHORIZED
    );
  }

  /// -----------------------------
  /// Initialize Vault
  /// -----------------------------
  public entry fun init_vault<T>(
    admin: &signer,
    mgmt_fee_bps: u64,
    perf_fee_bps: u64,
  ) {
    assert_admin(admin);
    // preventing vault reinitialization
    assert!(
      !exists<Vault<T>>(VAULT_ADMIN),
      E_VAULT_NOT_FOUND
    );

    let strategies = vector::empty<StrategyMetadata>();

    vector::push_back(
      &mut strategies,
      StrategyMetadata {
        id: STRATEGY_STABLE_SAFE,
        name: string::utf8(b"Stable Safe"),
        risk_level: RISK_LOW,
        description: string::utf8(b"Lend stablecoins with no leverage"),
        management_fee_bps: mgmt_fee_bps,
        performance_fee_bps: perf_fee_bps,
      }
    );

    vector::push_back(
      &mut strategies,
      StrategyMetadata {
        id: STRATEGY_MOVE_LONG,
        name: string::utf8(b"MOVE Long"),
        risk_level: RISK_MEDIUM,
        description: string::utf8(b"Conservative MOVE long with lending loop"),
        management_fee_bps: mgmt_fee_bps,
        performance_fee_bps: perf_fee_bps,
      }
    );

    move_to(
      admin,
      Vault<T> {
        total_assets: 0,
        total_shares: 0,
        active_strategy: STRATEGY_STABLE_SAFE,
        pending_profit: 0,
        mgmt_fee_bps,
        perf_fee_bps,
        // last_fee_ts: timestamp::now_seconds(),
        strategies,
      }
    );
  }

  /// -----------------------------
  /// Deposit
  /// -----------------------------
  public entry fun deposit<T>(
    user: &signer,
    amount: u64,
  ) acquires Vault, Position {
    assert!(amount > 0, E_INVALID_AMOUNT);

    let vault = borrow_global_mut<Vault<T>>(VAULT_ADMIN);

    let shares = if (vault.total_shares == 0) {
      amount
    } else {
      amount * vault.total_shares / vault.total_assets
    };

    vault.total_assets = vault.total_assets + amount;
    vault.total_shares = vault.total_shares + shares;

    if (!exists<Position>(signer::address_of(user))) {
      move_to(user, Position { shares });
    } else {
      let pos = borrow_global_mut<Position>(signer::address_of(user));
      pos.shares = pos.shares + shares;
    };
  }

  /// -----------------------------
  /// Withdraw
  /// -----------------------------
  public entry fun withdraw<T>(
    user: &signer,
    share_amount: u64,
  ) acquires Vault, Position {
    let pos = borrow_global_mut<Position>(signer::address_of(user));
    assert!(pos.shares >= share_amount, E_INSUFFICIENT_SHARES);

    let vault = borrow_global_mut<Vault<T>>(VAULT_ADMIN);

    let assets = share_amount * vault.total_assets / vault.total_shares;

    pos.shares = pos.shares - share_amount;
    vault.total_shares = vault.total_shares - share_amount;
    vault.total_assets = vault.total_assets - assets;

    // actual coin transfer omitted for hackathon
  }

  /// -----------------------------
  /// Switch Strategy
  /// -----------------------------
  public fun switch_strategy<T>(
    admin: &signer,
    strategy_id: u8,
  ) acquires Vault {
    assert_admin(admin);

    let vault = borrow_global_mut<Vault<T>>(signer::address_of(admin));

    assert!(
      strategy_id == STRATEGY_STABLE_SAFE || strategy_id == STRATEGY_MOVE_LONG,
      E_STRATEGY_NOT_FOUND
    );

    vault.active_strategy = strategy_id;
  }

  /// -----------------------------
  /// Mock Harvest (simulate yield)
  /// -----------------------------
  public fun harvest<T>(
    admin: &signer,
    simulated_profit: u64,
  ) acquires Vault {
    assert_admin(admin);

    let vault = borrow_global_mut<Vault<T>>(signer::address_of(admin));

    vault.pending_profit = vault.pending_profit + simulated_profit;
    vault.total_assets = vault.total_assets + simulated_profit;
  }

  /// -----------------------------
  /// Collect Fees
  /// -----------------------------
  public fun collect_fees<T>(
    admin: &signer,
  ) acquires Vault {
    assert_admin(admin);

    let vault = borrow_global_mut<Vault<T>>(signer::address_of(admin));

    let perf_fee =
        vault.pending_profit * vault.perf_fee_bps / 10_000;

    vault.total_assets = vault.total_assets - perf_fee;
    vault.pending_profit = 0;
    // vault.last_fee_ts = timestamp::now_seconds();

    // fee transfer omitted (send to treasury in mainnet)
  }

  /// -----------------------------
  /// View Helpers
  /// -----------------------------
  #[view]
  public fun get_vault_state<T>(): (u64, u64, u8) acquires Vault {
    let vault = borrow_global<Vault<T>>(VAULT_ADMIN);
    (vault.total_assets, vault.total_shares, vault.active_strategy)
  }

  #[view]
  public fun get_strategies<T>(
    owner: address
  ): vector<StrategyMetadata> acquires Vault {
    borrow_global<Vault<T>>(owner).strategies
  }
}
