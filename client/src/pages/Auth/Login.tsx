import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    login(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-5" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-xl shadow-2xl border border-white/40 relative z-10"
      >
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl font-bold text-primary">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input className="h-12 bg-white/50 border-primary/20 focus:border-primary/50" placeholder="johndoe" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" className="h-12 bg-white/50 border-primary/20 focus:border-primary/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <PremiumButton 
              type="submit" 
              className="w-full mt-4" 
              size="lg"
              isLoading={isLoggingIn}
            >
              Sign In
            </PremiumButton>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/register" className="font-semibold text-primary hover:underline underline-offset-4">
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
