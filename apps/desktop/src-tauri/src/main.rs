#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;
use std::thread;
use std::time::Duration;
use std::net::TcpStream;

fn main() {
  // Spawn Next.js server in a background thread
  thread::spawn(|| {
    let mut count = 0;
    // Check if port 3000 is already open
    while count < 3 {
      if TcpStream::connect("127.0.0.1:3000").is_ok() {
        println!("Next.js server is already running on port 3000.");
        return;
      }
      count += 1;
      thread::sleep(Duration::from_secs(1));
    }

    println!("Starting Next.js server in background...");
    
    // Spawn next dev/start process based on build config
    #[cfg(debug_assertions)]
    let status = Command::new("cmd")
      .args(&["/C", "pnpm --filter web dev"])
      .spawn();

    #[cfg(not(debug_assertions))]
    let status = Command::new("cmd")
      .args(&["/C", "pnpm --filter web start"])
      .spawn();

    match status {
      Ok(_) => println!("Next.js server spawned successfully."),
      Err(e) => eprintln!("Failed to spawn Next.js server: {}", e),
    }
  });

  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
