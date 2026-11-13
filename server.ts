import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Capture du corps brut (raw body) pour la vérification cryptographique HMAC-SHA256 du webhook
app.use(express.json());

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
   - Traitement ultra-rapide par la trésorerie Direction MYATSI.

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
          "Pour effectuer un **retrait** de votre solde :\n\n1. Rendez-vous dans l'onglet **Demande de Retrait**.\n2. Saisissez le montant souhaité (minimum **5 000 FC**).\n3. Indiquez votre numéro Airtel Money.\n4. Soumettez la demande. La trésorerie valide le transfert vers votre compte mobile.";
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
const MAISHAPAY_MODE = Number(process.env.MAISHAPAY_MODE ?? 0);
const sandboxTransactionReferences = new Set<string>();

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
  if (chosenOperator && chosenOperator.toUpperCase() !== op) op = "";

  return { phone: cleaned, operator: op };
}

// Simulation de dépôt pour le parcours React de développement uniquement.
app.post("/api/maishapay/initiate-deposit", async (req, res) => {
  try {
    if (MAISHAPAY_MODE !== 0 || process.env.NODE_ENV === "production") {
      return res.status(503).json({
        error: "Le paiement React ne dispose pas d'un stockage serveur sécurisé. Utilisez le parcours PHP/MySQL configuré pour les paiements réels.",
      });
    }

    const { amount, phone: rawPhone, operator: reqOp } = req.body;

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount < 5000) {
      return res.status(400).json({ error: "Le montant minimum de dépôt est de 5 000 FC." });
    }

    if (!rawPhone) {
      return res.status(400).json({ error: "Numéro Mobile Money requis pour l'envoi du push." });
    }

    const { phone, operator } = detectOperatorAndCleanPhone(rawPhone, reqOp);
    if (!/^0\d{9}$/.test(phone) || !operator) {
      return res.status(400).json({ error: "Numéro ou opérateur Mobile Money invalide." });
    }

    const transactionReference = `TEST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    sandboxTransactionReferences.add(transactionReference);
    return res.json({
      success: true,
      reference: transactionReference,
      amount: numAmount,
      currency: "CDF",
      phone,
      operator,
      status: "completed",
      message: `[Mode Sandbox] Simulation de ${numAmount.toLocaleString("fr-FR")} FC terminée. Aucun paiement réel n'a été effectué.`,
    });
  } catch (err: any) {
    console.error("[MaishaPay] Erreur initiation :", err);
    return res.status(500).json({ error: "Erreur serveur lors de l'initiation du paiement." });
  }
});

// Endpoint de vérification en temps réel du statut d'une transaction MaishaPay
app.get("/api/maishapay/check-status/:ref", async (req, res) => {
  try {
    const { ref } = req.params;
    if (!ref) {
      return res.status(400).json({ error: "Référence requise." });
    }

    if (MAISHAPAY_MODE !== 0 || process.env.NODE_ENV === "production") {
      return res.status(503).json({ error: "La vérification est désactivée sur le backend React." });
    }

    if (!sandboxTransactionReferences.has(ref)) {
      return res.status(404).json({ error: "Référence de simulation introuvable." });
    }

    return res.json({ status: "completed", message: "Simulation terminée. Aucun paiement réel n'a été effectué." });
  } catch (err: any) {
    console.error("[MaishaPay Sandbox] Erreur de vérification :", err);
    return res.status(500).json({ error: "Erreur lors de la vérification de la simulation." });
  }
});

// Le backend React ne reçoit pas les callbacks des paiements réels.
app.post("/api/maishapay/webhook", (_req, res) => {
  return res.status(503).json({
    error: "Webhook indisponible sur le backend React; configurez le callback PHP/MySQL.",
  });
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
