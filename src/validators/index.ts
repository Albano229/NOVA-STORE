import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
  role: z.literal("VENDOR"),
  phone: z.string().optional(),
  shopName: z.string().min(2, "Le nom de la boutique est requis pour les vendeurs").optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  price: z.number().positive("Le prix doit être positif"),
  comparePrice: z.number().positive().optional(),
  sku: z.string().optional(),
  stock: z.number().int().min(0, "Le stock ne peut pas être négatif"),
  weight: z.number().positive().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const shopSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const addressSchema = z.object({
  label: z.string().min(1, "Le libellé est requis"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville est requise"),
  state: z.string().optional(),
  postalCode: z.string().min(3, "Le code postal est requis"),
  country: z.string().min(2, "Le pays est requis"),
  phone: z.string().min(8, "Le numéro de téléphone est requis"),
  isDefault: z.boolean().default(false),
});

export const orderSchema = z.object({
  addressId: z.string().optional(),
  paymentMethod: z.enum(["STRIPE", "PAYPAL", "FLUTTERWAVE"]),
  notes: z.string().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "La note minimale est 1").max(5, "La note maximale est 5"),
  comment: z.string().optional(),
});
