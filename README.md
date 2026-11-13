<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/00dd5115-89ac-4171-8299-030b8c761431

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## MaishaPay Mobile Money

- The React/Node payment endpoint is a local demo only. It simulates a payment in development and refuses real transactions; demo balances are stored only in the browser.
- Real payments are handled by the PHP/MySQL flow (`dashboard.php`, `api_deposit.php`, and `maishapay_callback.php`). The server requires PHP with PDO MySQL and cURL, and the schema from `database.sql`.
- Configure `.env` on the PHP host with the merchant keys, `MAISHAPAY_MODE=1`, and `APP_URL` set to the public HTTPS base URL that serves the PHP callback. The values in `.env.example` are placeholders.
- `MAISHAPAY_MODE=0` is a no-payment sandbox: it does not call MaishaPay or credit a persistent wallet.
- Do not commit `.env` or expose merchant keys in client-side code.
