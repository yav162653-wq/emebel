import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/app/providers/ThemeProvider";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";
import { Moon, Sun, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ExternalAuthButtons } from "@/shared/components/ExternalAuthButtons";

export default function Login() {
  const { t } = useTranslation();
  const { login, isLoggingIn, requestMagicLink, isRequestingMagicLink } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");

  const loginSchema = z.object({
    username: z.string().min(1, t("auth.username") + " is required"),
    password: z.string().min(1, t("auth.password") + " is required"),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    login(data);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=1200"
            alt="Interior"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/60" />
        </div>
        <div className="relative z-10">
          <Link href="/">
            <span className="font-display text-3xl font-bold tracking-tighter cursor-pointer">SPACE.</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-4">
          <blockquote className="font-display text-3xl font-medium leading-snug">
            {t("auth.quote")}
          </blockquote>
          <p className="text-primary-foreground/60 text-sm font-mono uppercase tracking-widest">
            {t("auth.quoteAuthor")}
          </p>
        </div>
        <div className="relative z-10 flex gap-8">
          {[["14+", t("landing.collectionsLabel")], ["98%", t("landing.satisfactionLabel")], ["∞", t("landing.warrantyLabel")]].map(([val, label]) => (
            <div key={label}>
              <p className="font-display text-2xl font-bold">{val}</p>
              <p className="text-primary-foreground/60 text-xs font-mono uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex flex-col min-h-screen bg-background">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="lg:hidden">
            <span className="font-display text-xl font-bold tracking-tighter">SPACE.</span>
          </Link>
          <div className="lg:ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <span className="text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="font-semibold text-foreground hover:text-accent transition-colors">
                {t("auth.signUp")}
              </Link>
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm space-y-8"
          >
            <div className="space-y-2">
              <h1 className="font-display text-4xl font-bold text-foreground">{t("auth.welcomeBack")}</h1>
              <p className="text-muted-foreground text-sm">{t("auth.loginDesc")}</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("auth.username")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-username"
                          className="h-12 bg-secondary/30 border-border focus:border-primary/50 focus:ring-0 rounded-sm"
                          placeholder="johndoe"
                          autoComplete="username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("auth.password")}
                        </FormLabel>
                        <button
                          type="button"
                          onClick={() => setShowMagicLink((value) => !value)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showMagicLink ? t("auth.usePassword") : t("auth.forgotPassword")}
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            data-testid="input-password"
                            type={showPassword ? "text" : "password"}
                            className="h-12 bg-secondary/30 border-border focus:border-primary/50 focus:ring-0 rounded-sm pr-10"
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <PremiumButton
                  data-testid="button-submit-login"
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoggingIn}
                >
                  {t("auth.signIn")}
                </PremiumButton>
              </form>
            </Form>

            <ExternalAuthButtons />

            {showMagicLink && (
              <div className="space-y-4 rounded-sm border border-border bg-secondary/20 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("auth.magicLinkTitle")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("auth.magicLinkDesc")}</p>
                </div>
                <Input
                  type="email"
                  value={magicEmail}
                  onChange={(event) => setMagicEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 bg-background border-border rounded-sm"
                />
                <PremiumButton
                  type="button"
                  className="w-full"
                  variant="outline"
                  isLoading={isRequestingMagicLink}
                  disabled={!magicEmail.trim()}
                  onClick={() => requestMagicLink(magicEmail.trim())}
                >
                  {t("auth.sendMagicLink")}
                </PremiumButton>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground tracking-widest font-mono">
                  {t("auth.demoCredentials")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t("common.admin"), username: "nasa_admin", password: "password" },
                { label: t("common.user"), username: "user", password: "password" },
              ].map((cred) => (
                <button
                  key={cred.label}
                  type="button"
                  onClick={() => {
                    form.setValue("username", cred.username);
                    form.setValue("password", cred.password);
                  }}
                  className="flex flex-col items-start p-3 rounded-sm border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"
                >
                  <span className="text-xs font-semibold text-foreground">{cred.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{cred.username}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
