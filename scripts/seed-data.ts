/**
 * Pre-fetches SEC EDGAR fund holdings and FRED macro snapshots into
 * public/data/funds.json and public/data/macro.json. Phase 3 fills this in.
 */
async function main() {
  console.log("seed: stub — implemented in Phase 3 (SEC EDGAR + FRED).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
