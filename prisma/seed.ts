import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...\n");

  const password = await bcrypt.hash("test123", 12);
  const adminPassword = await bcrypt.hash("admin123", 12);

  // ── ADMIN ──
  const admin = await prisma.user.upsert({
    where: { email: "admin@nova.com" },
    update: {},
    create: {
      name: "Admin NOVA",
      email: "admin@nova.com",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // ── VENDEUR ──
  const vendor = await prisma.user.upsert({
    where: { email: "vendeur@nova.com" },
    update: {},
    create: {
      name: "Moussa Diop",
      email: "vendeur@nova.com",
      password,
      phone: "+229 66 12 34 56",
      role: "VENDOR",
      emailVerified: new Date(),
      shops: {
        create: {
          name: "Tech Store Bénin",
          slug: "tech-store-benin",
          description: "Votre spécialiste en électronique au Bénin",
          phone: "+229 66 12 34 56",
          email: "contact@techstore.sn",
          address: "Avenue de la Plage, Cotonou",
          city: "Cotonou",
          country: "Bénin",
          commissionRate: 10,
          isVerified: true,
        },
      },
    },
    include: { shops: true },
  });

  // Produits pour le vendeur
  if (vendor.shops?.[0]) {
    const products = [
      { name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", price: 895000, stock: 15, description: "Le dernier iPhone avec puce A17 Pro" },
      { name: "Samsung Galaxy S24", slug: "samsung-galaxy-s24", price: 650000, stock: 20, description: "Smartphone Samsung dernière génération" },
      { name: "MacBook Air M3", slug: "macbook-air-m3", price: 1200000, stock: 8, description: "Ordinateur portable Apple performant" },
      { name: "AirPods Pro 2", slug: "airpods-pro-2", price: 135000, stock: 30, description: "Écouteurs sans fil Apple" },
      { name: "Casque JBL Tune 770NC", slug: "casque-jbl-770nc", price: 45000, stock: 25, description: "Casque sans fil avec réduction de bruit" },
    ];

    for (const p of products) {
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: {},
        create: {
          shopId: vendor.shops[0].id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          stock: p.stock,
          description: p.description,
          isActive: true,
          isFeatured: true,
        },
      });
    }
    console.log(`${products.length} produits créés`);
  }

  // ── DEUXIÈME VENDEUR ──
  const vendor2 = await prisma.user.upsert({
    where: { email: "fatou@nova.com" },
    update: {},
    create: {
      name: "Fatou Ndiaye",
      email: "fatou@nova.com",
      password,
      phone: "+229 61 45 67 89",
      role: "VENDOR",
      emailVerified: new Date(),
      shops: {
        create: {
          name: "Mode Africa",
          slug: "mode-africa",
          description: "La mode africaine moderne et tendance",
          phone: "+229 61 45 67 89",
          email: "contact@modeafrica.sn",
          address: "Quatre Cent, Cotonou",
          city: "Cotonou",
          country: "Bénin",
          commissionRate: 12,
          isVerified: true,
        },
      },
    },
    include: { shops: true },
  });

  if (vendor2.shops?.[0]) {
    const products2 = [
      { name: "Boubou Moderne Homme", slug: "boubou-moderne-homme", price: 45000, stock: 20, description: "Boubou élégant pour hommes" },
      { name: "Robe Wax Africaine", slug: "robe-wax-africaine", price: 35000, stock: 15, description: "Robe en tissu wax authentique" },
      { name: "Ensemble Bazin Brodé", slug: "ensemble-bazin-brode", price: 65000, stock: 10, description: "Ensemble bazin ricrac brodé à la main" },
      { name: "Sac à Main Cuir", slug: "sac-main-cuir", price: 25000, stock: 18, description: "Sac à main en cuir véritable" },
    ];

    for (const p of products2) {
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: {},
        create: {
          shopId: vendor2.shops[0].id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          stock: p.stock,
          description: p.description,
          isActive: true,
          isFeatured: true,
        },
      });
    }
    console.log(`${products2.length} produits créés`);
  }

  // ── CLIENT ──
  const client = await prisma.user.upsert({
    where: { email: "client@nova.com" },
    update: {},
    create: {
      name: "Amadou Fall",
      email: "client@nova.com",
      password,
      phone: "+229 97 89 01 23",
      role: "CLIENT",
      emailVerified: new Date(),
    },
  });

  // ── CATÉGORIES ──
  const categories = [
    { name: "Électronique", slug: "electronique" },
    { name: "Mode & Vêtements", slug: "mode-vetements" },
    { name: "Maison & Décoration", slug: "maison-decoration" },
    { name: "Beauté & Santé", slug: "beaute-sante" },
    { name: "Sports & Loisirs", slug: "sports-loisirs" },
    { name: "Alimentation", slug: "alimentation" },
    { name: "Livres & Fournitures", slug: "livres-fournitures" },
    { name: "Auto & Moto", slug: "auto-moto" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log(`${categories.length} catégories créées\n`);

  console.log("╔══════════════════════════════════════════╗");
  console.log("║        COMPTES DE TEST NOVA              ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log("║                                          ║");
  console.log("║  ADMIN    admin@nova.com    / admin123   ║");
  console.log("║  VENDEUR  vendeur@nova.com  / test123    ║");
  console.log("║  CLIENT   client@nova.com   / test123    ║");
  console.log("║                                          ║");
  console.log("╚══════════════════════════════════════════╝\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
