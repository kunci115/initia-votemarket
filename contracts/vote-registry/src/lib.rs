pub mod contract;
pub mod error;
pub mod msg;
pub mod state;

#[cfg(not(feature = "library"))]
pub use contract::{execute, instantiate, query};
