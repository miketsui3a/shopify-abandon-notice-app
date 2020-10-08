## Setup
Visit shopify and create a shopify partner account.
The account should be verified before creating the shopify app.

## Installation

open the terminal in MacOS/ Linux or powershell in Windows, run:
```
git clone https://github.com/miketsui3a/shopify-abandon-notice-app.git
```

then run:
```
cd shopify-abandon-notice-app
```
Add
```
SCOPES=write_products,write_customers,write_draft_orders,read_script_tags,write_script_tags,read_customers,read_themes,write_themes,read_orders,write_price_rules,write_discounts
```
into the .env file.

Using the [Shopify-App-CLI](https://github.com/Shopify/shopify-app-cli) run:

```
shopify serve
```

follow the instruction in the terminal
