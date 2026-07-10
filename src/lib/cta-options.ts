import { TranslationKeys } from "@/i18n";

export interface CtaOption {
  value: string;
  label: string;
  icon: string;
  category: string;
}

export function getCtaOptions(t: TranslationKeys): CtaOption[] {
  const cta = t.cta;
  return [
    { value: cta.options.addToCart, label: cta.options.addToCart, icon: "🛒", category: cta.categories.classic },
    { value: cta.options.buyNow, label: cta.options.buyNow, icon: "💳", category: cta.categories.classic },
    { value: cta.options.order, label: cta.options.order, icon: "📦", category: cta.categories.classic },
    { value: cta.options.buy, label: cta.options.buy, icon: "💰", category: cta.categories.classic },
    { value: cta.options.reserve, label: cta.options.reserve, icon: "📅", category: cta.categories.reservation },
    { value: cta.options.reserveMySeat, label: cta.options.reserveMySeat, icon: "🎫", category: cta.categories.reservation },
    { value: cta.options.reserveNow, label: cta.options.reserveNow, icon: "⏰", category: cta.categories.reservation },
    { value: cta.options.iWantToReserve, label: cta.options.iWantToReserve, icon: "✨", category: cta.categories.reservation },
    { value: cta.options.download, label: cta.options.download, icon: "⬇️", category: cta.categories.digital },
    { value: cta.options.downloadEbook, label: cta.options.downloadEbook, icon: "📚", category: cta.categories.digital },
    { value: cta.options.accessFile, label: cta.options.accessFile, icon: "📁", category: cta.categories.digital },
    { value: cta.options.join, label: cta.options.join, icon: "👥", category: cta.categories.community },
    { value: cta.options.joinClub, label: cta.options.joinClub, icon: "🏆", category: cta.categories.community },
    { value: cta.options.subscribe, label: cta.options.subscribe, icon: "🔔", category: cta.categories.community },
    { value: cta.options.becomeMember, label: cta.options.becomeMember, icon: "⭐", category: cta.categories.community },
    { value: cta.options.buyPack, label: cta.options.buyPack, icon: "🎁", category: cta.categories.pack },
    { value: cta.options.discoverPack, label: cta.options.discoverPack, icon: "🔍", category: cta.categories.pack },
    { value: cta.options.getOffer, label: cta.options.getOffer, icon: "🔥", category: cta.categories.promotion },
    { value: cta.options.limitedOffer, label: cta.options.limitedOffer, icon: "⏳", category: cta.categories.promotion },
    { value: cta.options.seeOffer, label: cta.options.seeOffer, icon: "👀", category: cta.categories.promotion },
    { value: cta.options.requestQuote, label: cta.options.requestQuote, icon: "📋", category: cta.categories.service },
    { value: cta.options.bookAppointment, label: cta.options.bookAppointment, icon: "📞", category: cta.categories.service },
    { value: cta.options.contactSeller, label: cta.options.contactSeller, icon: "💬", category: cta.categories.service },
    { value: cta.options.signUp, label: cta.options.signUp, icon: "✍️", category: cta.categories.signup },
    { value: cta.options.register, label: cta.options.register, icon: "📝", category: cta.categories.signup },
    { value: cta.options.getStarted, label: cta.options.getStarted, icon: "🚀", category: cta.categories.signup },
    { value: cta.options.free, label: cta.options.free, icon: "🎉", category: cta.categories.free },
    { value: cta.options.downloadFree, label: cta.options.downloadFree, icon: "🆓", category: cta.categories.free },
    { value: cta.options.learnMore, label: cta.options.learnMore, icon: "ℹ️", category: cta.categories.info },
    { value: cta.options.discover, label: cta.options.discover, icon: "🌟", category: cta.categories.info },
  ];
}
