curl --location 'https://marchand.maishapay.online/api/payment/rest/vers1.0/merchant' \
--data '{
   "transactionReference": "k78Pu472",
   "gatewayMode" : "1",  // Gateway mode 1: Production; 0: Sandbox
    "publicApiKey" : "MP-LIVEPK-kK6yCY09V1jxxxxxxxxxx" , // your public API key,  required|string'\'',
    "secretApiKey" : "MP-LIVEPK-TpJWW05QUG$xxxxxxxxxx" , // your secret API key,  required|string'\'',
    "amount": 100,
    "currency" : "CDF", // Currency required CDF or USD 
    "chanel":"MOBILEMONEY",
    "provider":"MPESA",
    "walletID":"+243823616356"
}'