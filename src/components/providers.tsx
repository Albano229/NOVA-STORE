"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { I18nProvider } from "@/i18n/context";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { SiteSettingsProvider } from "@/contexts/site-settings-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { DynamicHead } from "@/components/ui/dynamic-head";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThemeProvider as DarkThemeProvider } from "@/contexts/theme-context";
import FloatingChatWidget from "@/components/ui/floating-chat-widget";
import { CartSync } from "@/components/cart-sync";
import { PushNotificationPrompt } from "@/components/ui/push-notification";
import { CompareBar } from "@/components/ui/compare-bar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DarkThemeProvider>
        <CurrencyProvider>
          <SiteSettingsProvider>
            <ThemeProvider>
              <DynamicHead />
              <WorkspaceProvider>
                <I18nProvider>
                  <CartSync />
                  {children}
                  <Toaster position="top-right" />
                  <FloatingChatWidget />
                  <PushNotificationPrompt />
                  <CompareBar />
                </I18nProvider>
              </WorkspaceProvider>
            </ThemeProvider>
          </SiteSettingsProvider>
        </CurrencyProvider>
      </DarkThemeProvider>
    </SessionProvider>
  );
}
