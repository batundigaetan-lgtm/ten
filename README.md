## MaishaPay Mobile Money

- The React app uses the Node endpoints in `server.ts`. Deposit attempts are recorded in Supabase before MaishaPay is called; the wallet is credited only after the server verifies the final result with MaishaPay.
- Apply `supabase_schema.sql` to the Supabase project before using the payment or withdrawal flows. The new-user trigger creates the profile, wallet, and welcome-bonus ledger records.
- Configure the MaishaPay merchant keys, v2 collection/transfer URLs, `APP_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in the Node server's `.env`. `APP_URL` must be the public HTTPS base URL that serves the Node callbacks. The service-role key must remain server-only: never prefix it with `VITE_` or expose it to the browser.
- Withdrawals reserve the amount atomically in Supabase, send an Airtel Money B2C transfer through MaishaPay, and update the wallet only after the provider's final result is verified. Failed payouts release the reservation; unresolved payouts remain reserved and can be reconciled by callback or status polling.
- The separate PHP/MySQL flow (`register.php`, `dashboard.php`, `api_deposit.php`, and `maishapay_callback.php`) uses `database.sql`; it is not the database path used by the React app.
- Do not commit `.env` or expose merchant keys in client-side code.
