import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Database } from "./src/types/supabase";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

let supabaseAdmin: SupabaseClient<Database> | null = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are missing.");
  }

  supabaseAdmin = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseAdmin;
}

async function getAuthenticatedUser(req: express.Request) {
  const authorization = req.header("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error("Authentication is required.");

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) throw new Error("Supabase session is invalid or expired.");
  return data.user;
}

// Initialisation du client Gemini
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Prompt d'assistance officiel du Service Client RentTech Hub (Strictement confidentiel sur la sécurité admin)
const SYSTEM_INSTRUCTION = `Vous êtes un conseiller officiel du Support Client et Trésorerie de RentTech Hub, la plateforme n°1 d'investissement et de location de matériel informatique (iPad, Laptops, Serveurs, Datacenters) en République Démocratique du Congo (Kinshasa, Goma, Lubumbashi, Bukavu).

INTERDICTION FORMELLE :
Ne dites JAMAIS que vous êtes une IA, une intelligence artificielle, un bot, un modèle ou un robot. Répondez toujours à la première personne du pluriel ou du singulier en tant que conseiller officiel de l'équipe Support Client RentTech Hub.

RÈGLES D'INFORMATIONS EXACTES & CONFIDENTIALITÉ :
1. MODÈLE ÉCONOMIQUE ET DÉPÔT AIRTEL MONEY:
   - Numéro officiel de recharge Airtel Money : +243976704762
   - Nom obligatoire du destinataire Airtel : MYATSI
   - Montant minimum de recharge : 5 000 FC.
   - Procédure : L'utilisateur effectue le transfert manuel via son téléphone vers +243976704762 (MYATSI), puis soumet sa preuve/référence sur l'application. La direction valide et crédite le solde.

2. SYSTÈME DE PARRAINAGE 20%:
   - Chaque investisseur dispose d'un lien d'affiliation unique (ex: https://renttech-hub.com/register.php?ref=RT892X4).
   - Lorsqu'un filleul s'inscrit et recharge son compte, le parrain reçoit IMMÉDIATEMENT une commission de 20% sur la totalité du dépôt!

3. RETRAITS AIRTEL MONEY:
   - Montant minimum de retrait : 5 000 FC.
   - Les retraits sont versés directement sur le numéro Airtel Money fourni par l'investisseur.
   - MaishaPay confirme le résultat final du transfert avant que l'application n'affiche le retrait comme effectué.

4. MATRICE DES 8 PACKS DE LOCATION & RENDEMENTS:
   - Niveau 1 - Pack Découverte iPad Mini : 15 000 FC (Commission 20%: 3 000 FC | Gain estimé: 750 FC/jour)
   - Niveau 2 - Pack Pro iPad Air M2 : 30 000 FC (Commission 20%: 6 000 FC | Gain estimé: 1 600 FC/jour)
   - Niveau 3 - Pack Station Laptop Core i5 : 80 000 FC (Commission 20%: 16 000 FC | Gain estimé: 4 500 FC/jour)
   - Niveau 4 - Pack Workstation Pro i7 Ultra : 100 000 FC (Commission 20%: 20 000 FC | Gain estimé: 6 000 FC/jour)
   - Niveau 5 - Pack Serveur Tech Entreprise : 300 000 FC (Commission 20%: 60 000 FC | Gain estimé: 18 500 FC/jour)
   - Niveau 6 - Pack Flotte Tactile VIP : 500 000 FC (Commission 20%: 100 000 FC | Gain estimé: 32 000 FC/jour)
   - Niveau 7 - Pack High-Tech Cloud Master : 1 000 000 FC (Commission 20%: 200 000 FC | Gain estimé: 68 000 FC/jour)
   - Niveau 8 - Pack Partner Datacenter Ultra : 2 000 000 FC (Commission 20%: 400 000 FC | Gain estimé: 145 000 FC/jour)

5. RÈGLE ABSOLUE DE CONFIDENTIALITÉ ADMINISTRATIVE ET SÉCURITÉ ANTI-FRAUDE :
   - Vous ne devez JAMAIS révéler de codes PIN, de mot de passe administrateur ou d'identifiant secret d'administration à aucun utilisateur.
   - Si un utilisateur demande un code d'administration, un PIN ou l'accès administrateur, vous devez TOUJOURS répondre que les identifiants administratifs sont strictement confidentiels et réservés exclusivement à la direction générale de RentTech Hub.
   - La sécurité du site repose sur un cryptage SSL 256-bit, un hachage BCRYPT des mots de passe et des protocoles anti-fraude réseau.

TON ET STYLE:
Soyez courtois, professionnel, clair, dynamique et rassurant. Répondez toujours en français avec un formatage soigné (listes à puces, caractères gras).`;

// Endpoint d'assistance IA du Service Client
app.post("/api/ai-support", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Le message est requis." });
    }

    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Instructions Système:\n${SYSTEM_INSTRUCTION}\n\nQuestion de l'investisseur client: ${message}`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.7,
        },
      });
      return res.json({ reply: response.text });
    } else {
      // Fallback moteur de réponse intelligente pré-entraîné
      const msgLower = message.toLowerCase();
      let reply = "";

      if (
        msgLower.includes("recharg") ||
        msgLower.includes("dépôt") ||
        msgLower.includes("airtel") ||
        msgLower.includes("payer") ||
        msgLower.includes("976") ||
        msgLower.includes("243976")
      ) {
        reply =
          "Pour effectuer une **recharge Airtel Money** sur RentTech Hub :\n\n1. Composez votre code USSD Airtel Money sur votre téléphone.\n2. Effectuez un transfert manuel vers le numéro officiel: **+243976704762** (Nom du destinataire: **MYATSI**).\n3. Allez dans l'onglet **Recharger Airtel** dans l'application.\n4. Indiquez le montant et téléchargez votre capture de preuve de paiement.\n\nLa direction valide la réception et votre solde est crédité immédiatement !";
      } else if (
        msgLower.includes("parrain") ||
        msgLower.includes("referral") ||
        msgLower.includes("commission") ||
        msgLower.includes("20%") ||
        msgLower.includes("filleul")
      ) {
        reply =
          "Le système de **parrainage à 20%** est 100% automatique :\n\n- Copiez votre lien d'affiliation unique disponible dans votre tableau de bord.\n- Partagez-le avec vos filleuls et contacts.\n- Dès qu'un filleul effectue une recharge, vous créditez **immédiatement 20%** sur l'ensemble de ses dépôts !";
      } else if (
        msgLower.includes("retrait") ||
        msgLower.includes("retirer") ||
        msgLower.includes("argent") ||
        msgLower.includes("solde")
      ) {
        reply =
          "Pour effectuer un **retrait** de votre solde :\n\n1. Rendez-vous dans l'onglet **Demande de Retrait**.\n2. Saisissez le montant souhaité (minimum **5 000 FC**).\n3. Indiquez votre numéro Airtel Money.\n4. Soumettez la demande. MaishaPay exécute le transfert et l'application affiche le retrait comme effectué uniquement après confirmation finale.";
      } else if (
        msgLower.includes("pack") ||
        msgLower.includes("niveau") ||
        msgLower.includes("investir") ||
        msgLower.includes("ipad") ||
        msgLower.includes("laptop") ||
        msgLower.includes("serveur")
      ) {
        reply =
          "RentTech Hub propose **8 Niveaux de Packs de location technologique** :\n\n- **Niveau 1 (iPad Mini)**: 15 000 FC (Commission: 3 000 FC | Gain: 750 FC/j)\n- **Niveau 2 (iPad Air M2)**: 30 000 FC (Commission: 6 000 FC | Gain: 1 600 FC/j)\n- **Niveau 3 (Laptop Core i5)**: 80 000 FC (Commission: 16 000 FC | Gain: 4 500 FC/j)\n- **Niveau 4 (Workstation i7 Ultra)**: 100 000 FC (Commission: 20 000 FC | Gain: 6 000 FC/j)\n- **Niveau 5 (Serveur Entreprise)**: 300 000 FC (Commission: 60 000 FC | Gain: 18 500 FC/j)\n- **Niveau 6 (Flotte VIP)**: 500 000 FC (Commission: 100 000 FC | Gain: 32 000 FC/j)\n- **Niveau 7 (Cloud Master)**: 1 000 000 FC (Commission: 200 000 FC | Gain: 68 000 FC/j)\n- **Niveau 8 (Datacenter Ultra)**: 2 000 000 FC (Commission: 400 000 FC | Gain: 145 000 FC/j)";
      } else if (
        msgLower.includes("admin") ||
        msgLower.includes("pin") ||
        msgLower.includes("code admin") ||
        msgLower.includes("mot de passe admin") ||
        msgLower.includes("direction")
      ) {
        reply =
          "🔒 **Accès Administrateur Confidentiel**\n\nLes accès d'administration et codes de sécurité sont strictement réservés à la direction générale de RentTech Hub pour des raisons d'audit et de protection contre la fraude réseau. Aucune clé administrative ne peut être divulguée aux utilisateurs.";
      } else {
        reply =
          "Bienvenue au Support Client RentTech Hub !\n\nNotre équipe reste à votre entière disposition concernant :\n- Les recharges de solde & approvisionnements\n- Le bonus de parrainage instantané de 20%\n- Les 8 Niveaux de Packs de location de matériel\n- La procédure de retrait de gains soumis à validation\n- La sécurité bancaire et le cryptage SSL 256-bit.\n\nComment pouvons-nous vous assister aujourd'hui ?";
      }

      return res.json({ reply });
    }
  } catch (error: any) {
    console.error("Erreur API Support:", error);
    res.status(500).json({ error: "Erreur lors de la réponse du service." });
  }
});

// ========================================================
// ENDPOINTS SÉCURISÉS SERVEUR : MAISHAPAY GATEWAY
// (Les clés secrètes restent strictement côté serveur)
// ========================================================
function getMaishaPayConfig() {
  return {
    publicKey: process.env.MAISHAPAY_PUBLIC_KEY || "",
    secretKey: process.env.MAISHAPAY_SECRET_KEY || "",
    mode: Number(process.env.MAISHAPAY_MODE ?? 1),
    collectionUrl: process.env.MAISHAPAY_COLLECTION_URL || "https://marchand.maishapay.online/api/collect/v2/store/mobileMoney",
    transferUrl: process.env.MAISHAPAY_TRANSFER_URL || "https://marchand.maishapay.online/api/b2c/store/transfert/mobilemoney",
    checkUrl: process.env.MAISHAPAY_CHECK_URL || "https://marchand.maishapay.online/api/transaction/rest/v2/check",
    appUrl: process.env.APP_URL || "http://localhost:3000",
  };
}

// Helper d'appel HTTPS vers MaishaPay.
async function callMaishaPay(url: string, payload: any) {
  const https = await import("https");
  return new Promise<{ status: number; data: any; raw: string }>((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        let json: any = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({ status: res.statusCode || 200, data: json, raw: body });
      });
    });

    req.on("error", (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

// Helper de nettoyage et détection d'opérateur Mobile Money RDC
function detectOperatorAndCleanPhone(rawPhone: string, chosenOperator?: string) {
  let cleaned = String(rawPhone || "").replace(/[^0-9]/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("243")) {
    cleaned = "0" + cleaned.substring(3);
  } else if (cleaned.length === 9) {
    cleaned = "0" + cleaned;
  }

  const pre = cleaned.substring(0, 3);
  let op = "";
  if (["097", "098", "099"].includes(pre)) op = "AIRTEL";
  else if (["081", "082", "083"].includes(pre)) op = "MPESA";
  else if (["084", "085", "089", "080"].includes(pre)) op = "ORANGE";
  else if (["090", "091"].includes(pre)) op = "AFRICELL";
  if (chosenOperator && chosenOperator.toUpperCase() !== op && ["AIRTEL", "MPESA", "ORANGE", "AFRICELL"].includes(chosenOperator.toUpperCase())) {
    op = chosenOperator.toUpperCase();
  }

  return { phone: cleaned, operator: op };
}

function getGatewayPaymentStatus(data: any): "succeeded" | "failed" | "pending" {
  const words = [
    data?.status,
    data?.transactionStatus,
    data?.statusDescription,
    data?.status_description,
    data?.data?.status,
    data?.data?.transactionStatus,
    data?.data?.statusDescription,
  ].flatMap((value) => String(value || "").toLowerCase().split(/[^a-z]+/).filter(Boolean));

  if (words.some((word) => ["success", "successful", "completed", "paid", "approved"].includes(word))) {
    return "succeeded";
  }
  if (words.some((word) => ["failed", "failure", "rejected", "declined", "canceled", "cancelled"].includes(word))) {
    return "failed";
  }
  return "pending";
}

async function checkMaishaPayStatus(reference: string, expectedAmount: number) {
  const config = getMaishaPayConfig();
  if (!config.publicKey || !config.secretKey) {
    throw new Error("MaishaPay server credentials are missing.");
  }

  const result = await callMaishaPay(`${config.checkUrl}?useRef=1`, {
    gatewayMode: config.mode,
    publicApiKey: config.publicKey,
    secretApiKey: config.secretKey,
    transactionId: reference,
  });
  if (result.status < 200 || result.status >= 300 || !result.data) {
    throw new Error(`MaishaPay status check failed (HTTP ${result.status}).`);
  }

  const responseData = result.data?.data || result.data;
  const gatewayReference = responseData?.transactionReference
    || responseData?.originatingTransactionId
    || responseData?.reference;
  if (gatewayReference && String(gatewayReference) !== reference) {
    throw new Error("MaishaPay returned a different transaction reference.");
  }

  const gatewayAmount = Number(
    responseData?.amount
      ?? responseData?.cost?.amount
      ?? responseData?.order?.cost?.amount
  );
  if (Number.isFinite(gatewayAmount) && gatewayAmount !== expectedAmount) {
    throw new Error("MaishaPay returned an amount that does not match the deposit.");
  }
  const currency = responseData?.currency
    ?? responseData?.cost?.currency
    ?? responseData?.order?.cost?.currency;
  if (currency && String(currency).toUpperCase() !== "CDF") {
    throw new Error("MaishaPay returned an unexpected currency.");
  }

  return { status: getGatewayPaymentStatus(result.data), data: responseData };
}

async function settleConfirmedDeposit(reference: string, expectedUserId?: string) {
  const admin = getSupabaseAdmin();
  const { data: payment, error: paymentError } = await admin
    .from("transactions")
    .select("id,user_id,amount,status")
    .eq("reference_id", reference)
    .eq("type", "deposit")
    .maybeSingle();

  if (paymentError) throw new Error("Could not load the deposit record.");
  if (!payment || (expectedUserId && payment.user_id !== expectedUserId)) {
    throw new Error("Deposit record was not found.");
  }
  if (payment.status === "completed") {
    return { status: "completed" as const };
  }
  if (payment.status !== "pending") {
    return { status: "failed" as const };
  }

  const gateway = await checkMaishaPayStatus(reference, Number(payment.amount));
  if (gateway.status === "pending") {
    return { status: "pending_pin" as const };
  }

  if (gateway.status === "failed") {
    const { error } = await admin
      .from("transactions")
      .update({ status: "failed" })
      .eq("id", payment.id)
      .eq("status", "pending");
    if (error) throw new Error("Could not record the failed payment.");
    return { status: "failed" as const };
  }

  const { data, error } = await admin.rpc("confirm_deposit_and_activate", {
    p_user_id: payment.user_id,
    p_amount: Number(payment.amount),
    p_reference: reference,
    p_payment_method: "maishapay",
  });
  if (error) throw new Error("MaishaPay confirmed the payment, but Supabase could not credit it.");
  if (!data || !data.success) {
    throw new Error(data?.error || "Supabase did not confirm the deposit credit.");
  }

  return { status: "completed" as const, newBalance: data.new_balance };
}

function getProviderTransactionId(data: any) {
  const responseData = data?.data || data;
  const transactionId = responseData?.transactionId ?? responseData?.transaction_id;
  return transactionId == null ? null : String(transactionId);
}

async function getWithdrawalWalletSnapshot(userId: string) {
  const { data: wallet, error } = await getSupabaseAdmin()
    .from("wallets")
    .select("available_balance_cdf,locked_balance_cdf")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !wallet) throw new Error("Could not load the user's wallet after withdrawal processing.");
  return {
    availableBalance: Number(wallet.available_balance_cdf),
    lockedBalance: Number(wallet.locked_balance_cdf),
  };
}

async function persistWithdrawalProviderId(requestId: string, transactionId: string | null) {
  if (!transactionId) return;
  const { error } = await getSupabaseAdmin()
    .from("withdrawal_requests")
    .update({ provider_transaction_id: transactionId })
    .eq("id", requestId);
  if (error) throw new Error("Could not save MaishaPay's transfer ID.");
}

async function finalizeWithdrawal(
  requestId: string,
  success: boolean,
  providerTransactionId: string | null,
  errorMessage?: string
) {
  const { data, error } = await getSupabaseAdmin().rpc("finalize_withdrawal_request", {
    p_request_id: requestId,
    p_success: success,
    p_reference: requestId,
    p_error: errorMessage || null,
    p_provider_transaction_id: providerTransactionId || null,
  });
  if (error) throw new Error("MaishaPay returned a final result, but Supabase could not finalize the withdrawal.");
  if (!data?.success) throw new Error(data?.error || "Supabase did not finalize the withdrawal.");

  const { data: request, error: requestError } = await getSupabaseAdmin()
    .from("withdrawal_requests")
    .select("user_id,status,provider_transaction_id")
    .eq("id", requestId)
    .maybeSingle();
  if (requestError || !request) throw new Error("Could not load the finalized withdrawal.");
  const wallet = await getWithdrawalWalletSnapshot(request.user_id);
  return {
    requestId,
    status: request.status as "pending" | "processed" | "rejected",
    providerTransactionId: request.provider_transaction_id || providerTransactionId || undefined,
    ...wallet,
  };
}

async function settleConfirmedWithdrawal(requestId: string, expectedUserId?: string) {
  const admin = getSupabaseAdmin();
  const { data: withdrawal, error } = await admin
    .from("withdrawal_requests")
    .select("id,user_id,amount,status,destination_phone,provider_transaction_id")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error("Could not load the withdrawal request.");
  if (!withdrawal || (expectedUserId && withdrawal.user_id !== expectedUserId)) {
    throw new Error("Withdrawal request was not found.");
  }
  if (withdrawal.status === "processed" || withdrawal.status === "rejected") {
    return {
      requestId,
      status: withdrawal.status,
      providerTransactionId: withdrawal.provider_transaction_id || undefined,
      ...(await getWithdrawalWalletSnapshot(withdrawal.user_id)),
    };
  }
  if (withdrawal.status !== "pending") {
    throw new Error("This withdrawal is not awaiting MaishaPay confirmation.");
  }

  const gateway = await checkMaishaPayStatus(requestId, Number(withdrawal.amount));
  const gatewayData = gateway.data;
  const providerTransactionId = getProviderTransactionId(gatewayData);
  const gatewayPhone = gatewayData?.recipient?.walletID
    ?? gatewayData?.paymentChannel?.walletID
    ?? gatewayData?.beneficiary?.walletID;
  const gatewayOperator = gatewayData?.provider?.libelle
    ?? gatewayData?.paymentChannel?.provider?.libelle
    ?? gatewayData?.paymentChannel?.provider;
  if (gatewayOperator && String(gatewayOperator).toUpperCase() !== "AIRTEL") {
    throw new Error("MaishaPay returned a different Mobile Money provider than the requested Airtel wallet.");
  }
  if (gatewayPhone) {
    const actualPhone = String(gatewayPhone).replace(/\D/g, "");
    const expectedPhone = String(withdrawal.destination_phone).replace(/\D/g, "");
    if (!actualPhone.endsWith(expectedPhone.slice(-9))) {
      throw new Error("MaishaPay returned a beneficiary phone number that does not match the withdrawal.");
    }
  }

  if (gateway.status === "pending") {
    await persistWithdrawalProviderId(requestId, providerTransactionId);
    return {
      requestId,
      status: "pending" as const,
      providerTransactionId: providerTransactionId || undefined,
      ...(await getWithdrawalWalletSnapshot(withdrawal.user_id)),
    };
  }

  await persistWithdrawalProviderId(requestId, providerTransactionId);
  const failureMessage = String(
    gatewayData?.transactionDescription
      || gatewayData?.statusDescription
      || "MaishaPay a refusé le transfert."
  );
  return finalizeWithdrawal(
    requestId,
    gateway.status === "succeeded",
    providerTransactionId,
    gateway.status === "failed" ? failureMessage : undefined
  );
}

app.post("/api/maishapay/initiate-withdrawal", async (req, res) => {
  let requestId = "";
  try {
    const user = await getAuthenticatedUser(req);
    const config = getMaishaPayConfig();
    const { requestId: rawRequestId, amount, phone: rawPhone } = req.body;
    requestId = String(rawRequestId || "").toLowerCase();
    const numAmount = Number(amount);

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId)) {
      return res.status(400).json({ error: "Référence de retrait invalide." });
    }
    if (!Number.isSafeInteger(numAmount) || numAmount < 5000) {
      return res.status(400).json({ error: "Le montant minimum de retrait est de 5 000 FC." });
    }

    const { phone, operator } = detectOperatorAndCleanPhone(String(rawPhone || ""));
    if (!/^0\d{9}$/.test(phone) || operator !== "AIRTEL") {
      return res.status(400).json({ error: "Le retrait MaishaPay est actuellement disponible uniquement vers un numéro Airtel Money valide." });
    }
    if (!config.publicKey || !config.secretKey) {
      return res.status(503).json({ error: "Les clés serveur MaishaPay sont manquantes." });
    }

    const admin = getSupabaseAdmin();
    const { data: reservation, error: reservationError } = await admin.rpc("submit_withdrawal_request", {
      p_request_id: requestId,
      p_user_id: user.id,
      p_amount: numAmount,
      p_destination_phone: phone,
      p_payment_method: "maishapay_airtel_money",
    });
    if (reservationError) throw new Error("Could not reserve the withdrawal in Supabase.");
    if (!reservation?.success) {
      return res.status(400).json({ error: reservation?.error || "Impossible de réserver le montant du retrait." });
    }

    if (reservation.status === "processed" || reservation.status === "rejected") {
      const current = await settleConfirmedWithdrawal(requestId, user.id);
      return res.json(current);
    }

    if (reservation.already_exists) {
      try {
        return res.json(await settleConfirmedWithdrawal(requestId, user.id));
      } catch (reconcileError: any) {
        console.warn("[MaishaPay Withdrawal] Existing request remains pending:", reconcileError.message);
        return res.status(202).json({
          requestId,
          status: "pending",
          ...(await getWithdrawalWalletSnapshot(user.id)),
        });
      }
    }

    const callbackUrl = `${config.appUrl}/api/maishapay/withdrawal-webhook?ref=${requestId}`;
    const payload = {
      transactionReference: requestId,
      gatewayMode: config.mode,
      publicApiKey: config.publicKey,
      secretApiKey: config.secretKey,
      order: {
        motif: "Retrait RentTech",
        amount: String(numAmount),
        currency: "CDF",
        customerFullName: user.user_metadata?.full_name || user.user_metadata?.name || "",
        customerEmailAdress: user.email || "",
      },
      paymentChannel: {
        provider: operator,
        walletID: `+243${phone.substring(1)}`,
        callbackUrl,
      },
    };

    let gatewayResponse: { status: number; data: any; raw: string };
    try {
      gatewayResponse = await callMaishaPay(config.transferUrl, payload);
    } catch (gatewayError: any) {
      console.error("[MaishaPay Withdrawal] Transfer request outcome is unknown:", gatewayError);
      return res.status(202).json({
        requestId,
        status: "pending",
        ...(await getWithdrawalWalletSnapshot(user.id)),
      });
    }

    const gatewayData = gatewayResponse.data?.data || gatewayResponse.data;
    const providerTransactionId = getProviderTransactionId(gatewayData);
    await persistWithdrawalProviderId(requestId, providerTransactionId);
    const gatewayStatus = getGatewayPaymentStatus(gatewayResponse.data);

    if (gatewayStatus === "failed") {
      const returnedReference = gatewayData?.originatingTransactionId
        ?? gatewayData?.transactionReference
        ?? gatewayData?.reference;
      if (returnedReference && String(returnedReference) !== requestId) {
        throw new Error("MaishaPay returned a different withdrawal reference.");
      }
      const failureMessage = String(
        gatewayData?.transactionDescription
          || gatewayData?.statusDescription
          || "MaishaPay a refusé le transfert."
      );
      return res.json(await finalizeWithdrawal(requestId, false, providerTransactionId, failureMessage));
    }

    if (gatewayStatus === "succeeded") {
      return res.json(await settleConfirmedWithdrawal(requestId, user.id));
    }

    return res.status(202).json({
      requestId,
      status: "pending",
      providerTransactionId: providerTransactionId || undefined,
      ...(await getWithdrawalWalletSnapshot(user.id)),
    });
  } catch (err: any) {
    console.error("[MaishaPay Withdrawal Error]", err);
    if (requestId) {
      try {
        const { data: request } = await getSupabaseAdmin()
          .from("withdrawal_requests")
          .select("user_id,status")
          .eq("id", requestId)
          .maybeSingle();
        if (request?.status === "pending") {
          return res.status(202).json({
            requestId,
            status: "pending",
            ...(await getWithdrawalWalletSnapshot(request.user_id)),
          });
        }
      } catch (reconcileError) {
        console.error("[MaishaPay Withdrawal] Could not report pending request:", reconcileError);
      }
    }
    return res.status(500).json({ error: err.message || "Erreur serveur lors du retrait MaishaPay." });
  }
});

app.get("/api/maishapay/withdrawal-status/:requestId", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const requestId = String(req.params.requestId || "").toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId)) {
      return res.status(400).json({ error: "Référence de retrait invalide." });
    }
    return res.json(await settleConfirmedWithdrawal(requestId, user.id));
  } catch (err: any) {
    console.error("[MaishaPay Withdrawal Status Error]", err);
    return res.status(500).json({ error: err.message || "Erreur lors de la vérification du retrait." });
  }
});

app.post("/api/maishapay/withdrawal-webhook", async (req, res) => {
  try {
    const payload = req.body;
    const requestId = String(
      payload?.originatingTransactionId
        || payload?.transactionReference
        || req.query.ref
        || ""
    ).toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId)) {
      return res.status(400).json({ error: "Withdrawal reference is required." });
    }
    const result = await settleConfirmedWithdrawal(requestId);
    return res.status(200).json({ status: result.status, reference: requestId });
  } catch (err: any) {
    console.error("[MaishaPay Withdrawal Webhook Error]", err);
    return res.status(500).json({ error: "Could not reconcile the MaishaPay withdrawal." });
  }
});

// 1. Initialisation réelle d'un paiement Mobile Money push MaishaPay
app.post("/api/maishapay/initiate-deposit", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const config = getMaishaPayConfig();
    const { amount, phone: rawPhone, operator: reqOp, customerName, customerEmail } = req.body;

    const numAmount = Number(amount);
    if (!Number.isSafeInteger(numAmount) || numAmount < 5000) {
      return res.status(400).json({ error: "Le montant minimum de dépôt est de 5 000 FC." });
    }

    if (!rawPhone) {
      return res.status(400).json({ error: "Numéro Mobile Money requis pour l'envoi du push." });
    }

    const { phone, operator } = detectOperatorAndCleanPhone(rawPhone, reqOp);
    if (!/^0\d{9}$/.test(phone) || !operator) {
      return res.status(400).json({ error: "Numéro ou opérateur Mobile Money invalide (10 chiffres, ex: 0992611845)." });
    }

    if (!config.publicKey || !config.secretKey) {
      return res.status(400).json({
        error: "Clés d'API MaishaPay manquantes dans la configuration (.env). Veuillez renseigner MAISHAPAY_PUBLIC_KEY et MAISHAPAY_SECRET_KEY.",
      });
    }

    const admin = getSupabaseAdmin();
    const { data: wallet, error: walletError } = await admin
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (walletError || !wallet) {
      return res.status(400).json({ error: "Le portefeuille Supabase de cet utilisateur est introuvable." });
    }

    const transactionReference = `DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const callbackUrl = `${config.appUrl}/api/maishapay/webhook?ref=${transactionReference}`;
    const { error: insertError } = await admin.from("transactions").insert({
      wallet_id: wallet.id,
      user_id: user.id,
      type: "deposit",
      amount: numAmount,
      status: "pending",
      reference_id: transactionReference,
      description: "Dépôt MaishaPay en attente de confirmation",
      payment_method: "maishapay",
      metadata: { phone, operator },
    });
    if (insertError) {
      console.error("[MaishaPay] Could not create Supabase deposit record:", insertError.message);
      return res.status(500).json({ error: "Impossible d'enregistrer le dépôt avant le paiement." });
    }

    const internationalPhone = `+243${phone.substring(1)}`;
    const payload = {
      gatewayMode: config.mode,
      publicApiKey: config.publicKey,
      secretApiKey: config.secretKey,
      transactionReference,
      order: {
        motif: "Dépôt RentTech",
        amount: numAmount,
        currency: "CDF",
        customerFullName: customerName || user.user_metadata?.full_name || "Investisseur RentTech",
        customerEmailAdress: customerEmail || user.email || "investisseur@renttech.com",
      },
      paymentChannel: {
        channel: "MOBILEMONEY",
        provider: operator,
        walletID: internationalPhone,
        callbackUrl,
      },
    };

    console.log(`[MaishaPay] Appel API vers ${config.collectionUrl} (mode ${config.mode}) pour ${phone} (${operator}) - Montant: ${numAmount} FC`);

    const result = await callMaishaPay(config.collectionUrl, payload);
    const { status: httpStatus, data, raw } = result;

    console.log(`[MaishaPay] Réponse HTTP ${httpStatus}.`);

    const apiData = data?.data || data;
    const statusCode = Number(apiData?.status_code || apiData?.statusCode || data?.status || httpStatus);
    const statusDesc = String(apiData?.transactionStatus || apiData?.statusDescription || data?.message || "").toUpperCase();
    const isAccepted = httpStatus >= 200
      && httpStatus < 300
      && ([200, 201, 202].includes(statusCode) || ["ACCEPTED", "PENDING", "SUCCESS", "SUCCEEDED"].includes(statusDesc));

    if (isAccepted) {
      const gatewayTxnId = String(apiData?.transactionId || data?.transactionId || "");
      if (gatewayTxnId) {
        const { error } = await admin
          .from("transactions")
          .update({ metadata: { phone, operator, gateway_transaction_id: gatewayTxnId } })
          .eq("reference_id", transactionReference);
        if (error) console.error("[MaishaPay] Could not store gateway transaction ID:", error.message);
      }

      return res.json({
        success: true,
        reference: transactionReference,
        amount: numAmount,
        currency: "CDF",
        phone,
        operator,
        status: "pending_pin",
        message: `Notification push Mobile Money envoyée sur votre téléphone (${phone}). Tapez votre code PIN Mobile Money pour confirmer le paiement de ${numAmount.toLocaleString("fr-FR")} FC.`,
      });
    }

    // Extraction précise du message retourné par MaishaPay
    const errorTitle = data?.title || "";
    const errorDesc = data?.description || data?.message || raw || "Impossible d'initier le paiement push Mobile Money.";
    const fullError = errorTitle && errorDesc && !errorDesc.includes(errorTitle) ? `${errorTitle}: ${errorDesc}` : errorDesc;

    console.warn(`[MaishaPay Erreur API] ${fullError}`);
    const { error: updateError } = await admin
      .from("transactions")
      .update({ status: "failed", description: fullError.slice(0, 500) })
      .eq("reference_id", transactionReference)
      .eq("status", "pending");
    if (updateError) console.error("[MaishaPay] Could not record failed initiation:", updateError.message);

    return res.status(400).json({
      error: fullError,
    });
  } catch (err: any) {
    console.error("[MaishaPay] Exception initiation :", err);
    return res.status(500).json({ error: err.message || "Erreur serveur lors de l'appel MaishaPay." });
  }
});

// 2. Vérification en temps réel du statut auprès de l'API MaishaPay Check v2
app.get("/api/maishapay/check-status/:ref", async (req, res) => {
  try {
    const { ref } = req.params;
    if (!ref) {
      return res.status(400).json({ error: "Référence requise." });
    }

    const user = await getAuthenticatedUser(req);
    const result = await settleConfirmedDeposit(ref, user.id);
    return res.json({
      status: result.status,
      ...(result.status === "completed" ? { message: "Paiement confirmé et enregistré." } : {}),
      ...(result.status === "failed" ? { message: "Paiement refusé ou annulé." } : {}),
      ...(result.status === "pending_pin" ? { message: "En attente de confirmation du code PIN sur votre téléphone." } : {}),
    });
  } catch (err: any) {
    console.error("[MaishaPay Check Error]", err);
    return res.status(500).json({ error: err.message || "Erreur lors de la vérification MaishaPay." });
  }
});

// 3. Webhook de confirmation MaishaPay
app.post("/api/maishapay/webhook", async (req, res) => {
  try {
    const payload = req.body;
    const ref = String(
      payload?.transaction_reference
        || payload?.transactionReference
        || payload?.originatingTransactionId
        || payload?.reference
        || req.query.ref
        || ""
    );
    if (!ref) return res.status(400).json({ error: "Transaction reference is required." });

    const result = await settleConfirmedDeposit(ref);
    return res.status(200).json({ status: result.status, reference: ref });
  } catch (err: any) {
    console.error("[MaishaPay Webhook Error]", err);
    return res.status(500).json({ error: "Could not reconcile the MaishaPay payment." });
  }
});

// 3. API Sécurisée de Vérification Préalable des Retraits
// Règles 3 & 4 : Vérifie statut 'active', minimum 5 000 FC et exclusion du bonus de 2 000 FC
app.post("/api/withdrawals/verify", async (req: any, res) => {
  try {
    const { isActivated, amount, balance, welcomeBonusClaimed } = req.body;

    // Règle 2 & 3 : Compte obligatoirement activé
    if (!isActivated) {
      return res.status(403).json({
        allowed: false,
        error: "Droit de retrait bloqué : Votre compte est en attente d'activation. Effectuez votre premier dépôt pour activer votre compte et débloquer les retraits.",
      });
    }

    // Règle 3 : Retrait minimum 5 000 FC
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 5000) {
      return res.status(400).json({
        allowed: false,
        error: "Le montant minimum de retrait est de 5 000 FC.",
      });
    }

    // Règle 3 : Le bonus de bienvenue (2 000 FC) ne peut être retiré directement
    const bonusToDeduct = welcomeBonusClaimed ? 2000 : 0;
    const withdrawableBalance = Math.max(0, Number(balance) - bonusToDeduct);

    if (numAmount > withdrawableBalance) {
      return res.status(400).json({
        allowed: false,
        error: `Solde retirable insuffisant (${withdrawableBalance.toLocaleString("fr-FR")} FC disponibles). Le bonus de bienvenue de 2 000 FC est réservé à l'investissement locatif et ne peut être retiré directement.`,
      });
    }

    return res.status(200).json({
      allowed: true,
      withdrawableBalance,
      message: "Vérification de sécurité validée. Retrait autorisé.",
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur serveur lors de la vérification du retrait." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur RentTech Hub démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
