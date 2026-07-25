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
import { insertUserSchema } from "@shared/schema";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

const registerSchema = insertUserSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const { t } = useTranslation();
  const { register, isRegistering } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", name: "", confirmPassword: "" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = data;
    register(userData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200"
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
        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-4xl font-medium leading-snug">
            {t("landing.heroTitle").replace("\n", " ")}
          </h2>
          <div className="flex flex-col gap-3">
            {(t("auth.registerBenefits", { returnObjects: true }) as string[]).map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                <span className="text-primary-foreground/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-primary-foreground/40 text-xs font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} Space Furniture
          </p>
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
              {t("auth.haveAccount")}{" "}
              <Link href="/login" className="font-semibold text-foreground hover:text-accent transition-colors">
                {t("auth.signIn")}
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
              <h1 className="font-display text-4xl font-bold text-foreground">{t("auth.createAccount")}</h1>
              <p className="text-muted-foreground text-sm">{t("auth.registerDesc")}</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("auth.fullName")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-name"
                          className="h-12 bg-secondary/30 border-border focus:border-primary/50 rounded-sm"
                          placeholder="John Doe"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          className="h-12 bg-secondary/30 border-border focus:border-primary/50 rounded-sm"
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
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("auth.password")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-password"
                          type="password"
                          className="h-12 bg-secondary/30 border-border focus:border-primary/50 rounded-sm"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("auth.confirmPassword")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-confirm-password"
                          type="password"
                          className="h-12 bg-secondary/30 border-border focus:border-primary/50 rounded-sm"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <PremiumButton
                  data-testid="button-submit-register"
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isRegistering}
                >
                  {t("auth.createAccountBtn")}
                </PremiumButton>

                <p className="text-center text-xs text-muted-foreground">
                  {t("auth.termsText")}{" "}
                  <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
                    {t("auth.termsOfService")}
                  </a>{" "}
                  {t("auth.and")}{" "}
                  <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
                    {t("auth.privacyPolicy")}
                  </a>.
                </p>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
