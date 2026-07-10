import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { withRateLimit } from "@/lib/api-rate-limit";

interface ChatRequest {
  message: string;
}

const GREETINGS = ["bonjour", "salut", "hello", "hey", "coucou", "bonsoir", "cc", "slt"];
const PRODUCT_KEYWORDS = ["produit", "acheter", "achat", "commander", "vente", "catalogue", "article", "rechercher", "cherche", "tu as", "disponible", "promo", "offre", "réduction", "nouveau"];
const NAV_KEYWORDS = ["dashboard", "page", "aller", "comment", "trouver", "navigation", "menu", "où"];
const SELLER_KEYWORDS = ["vendeur", "vendre", "créer un produit", "boutique", "comment vendre", "devenir vendeur"];
const ORDER_KEYWORDS = ["commande", "order", "paiement", "livraison", "suivi", "colis", "statut"];
const HELP_KEYWORDS = ["aide", "help", "support", "bug", "problème", "erreur"];
const PROMO_KEYWORDS = ["promo", "promotion", "offre", "réduction", "code promo", "flash", "solde"];
const CONTACT_KEYWORDS = ["contact", "humain", "agent", "parler", "personne", "support"];

function matchKw(msg: string, kw: string[]): boolean {
  const lower = msg.toLowerCase();
  return kw.some((k) => lower.includes(k));
}

async function searchProducts(query: string): Promise<Array<{ id: string; name: string; price: number; slug: string; image: string }>> {
  try {
    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT p.id, p.name, p.price, p.slug,
        (SELECT pi.url FROM "ProductImage" pi WHERE pi."productId" = p.id ORDER BY pi."position" ASC LIMIT 1) as image
       FROM "Product" p
       WHERE p."isActive" = true
         AND (p.name ILIKE $1 OR p.description ILIKE $1)
       ORDER BY p."soldCount" DESC
       LIMIT 3`,
      [`%${query}%`]
    );
    return result.rows;
  } catch {
    return [];
  }
}

function generateReply(type: string, userName?: string): { reply: string; suggestions: string[] } {
  const greeting = userName ? `Bonjour ${userName}` : "Bonjour";

  switch (type) {
    case "greeting":
      return {
        reply: `${greeting} ! 👋 Je suis Nova, votre assistant NOVA Store. Comment puis-je vous aider ?`,
        suggestions: ["Voir les produits", "Comment vendre ?", "Suivre ma commande"],
      };
    case "seller":
      return {
        reply: `${greeting} ! Pour vendre sur NOVA Store :\n\n1. **Créez un compte** vendeur\n2. **Configurez** votre boutique (nom, logo, bannière)\n3. **Ajoutez vos produits** avec photos et descriptions\n4. **Définissez** vos prix et options de livraison\n5. **Publiez** et commencez à vendre !\n\n📊 Commission : 5% par vente\n💰 Paiements : Mobile Money, virement bancaire\n🚀 Mise en ligne : immédiate\n\nBesoin d'aide pour créer votre boutique ?`,
        suggestions: ["Créer ma boutique", "Voir des exemples", "Tarifs et commissions"],
      };
    case "product":
      return {
        reply: "🔍 Recherche de produits en cours... Tapez le nom d'un produit que vous cherchez !",
        suggestions: ["Voir les nouveautés", "Produits en promo", "Tous les produits"],
      };
    case "product_found":
      return {
        reply: "📦 Voici les produits correspondants :",
        suggestions: ["Voir plus de produits", "Contacter le vendeur"],
      };
    case "order":
      return {
        reply: `${greeting} ! Pour suivre votre commande :\n\n1. Allez dans **Mon Compte** → **Mes Commandes**\n2. Le statut s'affiche en temps réel\n3. Vous recevez des notifications par SMS\n\n📋 Statuts possibles :\n• En attente → En cours de traitement\n• Confirmée → En préparation\n• Expédiée → En livraison\n• Livrée ✅\n\nUne question sur une commande spécifique ?`,
        suggestions: ["Voir mes commandes", "Contacter le support", "Politique de retour"],
      };
    case "promo":
      return {
        reply: "🏷️ **Offres en cours sur NOVA Store :**\n\n• **Ventes flash** — Réductions jusqu'à -70%\n• **Nouveaux vendeurs** — Offres de lancement\n• **Codes promo** — Inscrivez-vous pour en recevoir\n• **Livraison gratuite** — Sur certaines catégories\n\n💡 **Astuce :** Activez les notifications pour ne rien manquer !",
        suggestions: ["Voir les promos", "S'inscrire aux alertes", "Code promo"],
      };
    case "help":
      return {
        reply: `${greeting} ! Je peux vous aider avec :\n\n• 🛍️ **Produits** — Rechercher, acheter\n• 📦 **Commandes** — Suivi, livraison\n• 🏪 **Vendeur** — Créer, gérer\n• 🏷️ **Promos** — Offres en cours\n• 💬 **Support** — Contact humain\n\nQue souhaitez-vous savoir ?`,
        suggestions: ["Produits", "Commandes", "Vendeur", "Support humain"],
      };
    case "contact":
      return {
        reply: "📞 **Contacter le support NOVA Store :**\n\n• 📧 Email : support@novastore.com\n• 📱 WhatsApp : +229 52 23 63 14\n• 💬 Chat en ligne : ici mismo !\n\n⏰ Horaires : Lun-Sam, 8h-20h\n\nUn agent humain vous répondra rapidement.",
        suggestions: ["Créer un ticket", "FAQ", "Retour au chat"],
      };
    default:
      return {
        reply: `${greeting} ! Je peux vous aider avec :\n\n• **Produits** — Rechercher et acheter\n• **Commandes** — Suivre vos achats\n• **Vendeur** — Comment vendre\n• **Promos** — Offres en cours\n• **Support** — Contact humain\n\nPosez-moi votre question !`,
        suggestions: ["Produits", "Commandes", "Comment vendre ?", "Promos"],
      };
  }
}

export const POST = withRateLimit(
  async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch { /* empty */ }

    const lower = message.trim().toLowerCase();
    let responseType = "unknown";
    let products: Array<{ id: string; name: string; price: number; slug: string; image: string }> = [];

    if (PRODUCT_KEYWORDS.some(kw => lower.includes(kw))) {
      const searchTerms = lower
        .replace(/produit|acheter|achat|commander|vente|catalogue|article|rechercher|cherche|tu as|disponible|promo|offre|réduction|nouveau/g, "")
        .trim();

      if (searchTerms.length > 1) {
        products = await searchProducts(searchTerms);
        if (products.length > 0) {
          responseType = "product_found";
        } else {
          responseType = "product";
        }
      } else {
        responseType = "product";
      }
    } else if (matchKw(lower, GREETINGS) && lower.split(" ").length <= 3) responseType = "greeting";
    else if (matchKw(lower, SELLER_KEYWORDS)) responseType = "seller";
    else if (matchKw(lower, ORDER_KEYWORDS)) responseType = "order";
    else if (matchKw(lower, PROMO_KEYWORDS)) responseType = "promo";
    else if (matchKw(lower, CONTACT_KEYWORDS)) responseType = "contact";
    else if (matchKw(lower, HELP_KEYWORDS)) responseType = "help";
    else if (matchKw(lower, NAV_KEYWORDS)) responseType = "help";

    const { reply, suggestions } = generateReply(responseType, session?.user?.name || undefined);

    return NextResponse.json({
      reply,
      products: products.length > 0 ? products : undefined,
      suggestions,
      userName: session?.user?.name || null,
    });
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json({
      reply: "Bonjour ! Je suis Nova, votre assistant NOVA Store. Comment puis-je vous aider ?",
      products: undefined,
      suggestions: ["Produits", "Commandes", "Comment vendre ?"],
    });
  }
},
  { limit: 10, window: 60_000, keyPrefix: "ai-chat" }
);

export const GET = withRateLimit(
  async function GET() {
  return NextResponse.json({ history: [] });
},
  { limit: 10, window: 60_000, keyPrefix: "ai-chat" }
);
