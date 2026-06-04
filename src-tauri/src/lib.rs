use tauri_plugin_sql::{Migration, MigrationKind};
use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    Migration {
    version: 1,
    description: "create_initial_schema",
    sql: r#"
      CREATE TABLE IF NOT EXISTS clients (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        company     TEXT,
        email       TEXT,
        phone       TEXT,
        notes       TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id              TEXT PRIMARY KEY,
        client_id       TEXT REFERENCES clients(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        amount          REAL NOT NULL DEFAULT 0,
        currency        TEXT NOT NULL DEFAULT 'USD',
        cycle           TEXT NOT NULL DEFAULT 'monthly',
        category        TEXT NOT NULL DEFAULT 'other',
        type            TEXT NOT NULL DEFAULT 'subscription',
        start_date      TEXT NOT NULL,
        url             TEXT,
        payment_method  TEXT DEFAULT 'Not Specified',
        tags            TEXT NOT NULL DEFAULT '[]',
        notes           TEXT,
        active          INTEGER NOT NULL DEFAULT 1,
        recurring       INTEGER NOT NULL DEFAULT 1,
        created_at      TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);

      CREATE TABLE IF NOT EXISTS tags (
        id    TEXT PRIMARY KEY,
        name  TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS payment_history (
        id              TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        paid_date       TEXT NOT NULL,
        amount          REAL NOT NULL,
        currency        TEXT NOT NULL,
        note            TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_payment_sub ON payment_history(subscription_id);

      CREATE TABLE IF NOT EXISTS exchange_rates (
        currency      TEXT PRIMARY KEY,
        rate_to_base  REAL NOT NULL,
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        key    TEXT PRIMARY KEY,
        value  TEXT
      );
    "#,
    kind: MigrationKind::Up,
    },
    Migration {
      version: 2,
      description: "add_monthly_equivalent",
      sql: "ALTER TABLE subscriptions ADD COLUMN monthly_equivalent REAL;",
      kind: MigrationKind::Up,
    },
  ];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:subtracker.db", migrations)
        .build(),
    )
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_autostart::init(
      MacosLauncher::LaunchAgent,
      Some(vec!["--minimized"]),
    ))
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // System tray with a small menu.
      let open_i = MenuItem::with_id(app, "open", "Open SubTracker", true, None::<&str>)?;
      let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&open_i, &quit_i])?;

      TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("MITS SubTracker")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "open" => show_main(app),
          "quit" => app.exit(0),
          _ => {}
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } = event
          {
            show_main(tray.app_handle());
          }
        })
        .build(app)?;

      Ok(())
    })
    // Closing the window hides to tray instead of quitting.
    .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
        let _ = window.hide();
        api.prevent_close();
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

fn show_main(app: &tauri::AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();
  }
}
