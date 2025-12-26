import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";
import { motion } from "framer-motion";

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Register() {
  const { register, isRegistering } = useAuth();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", name: "", confirmPassword: "" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...userData } = data;
    register(userData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[url('https://pixabay.com/get/g46c94cfd3542ed7d179f59678f9f40b5ba22af1967f3a978e625343e5de0f15aba528547e93a9238e5e6b16f677db1d36d18bcb6039e61029600cf8a460a7bd3_1280.jpg')] bg-cover bg-center opacity-5" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-xl shadow-2xl border border-white/40 relative z-10"
      >
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl font-bold text-primary">Join Us</h1>
          <p className="text-muted-foreground">Create your account to start shopping</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input className="h-12 bg-white/50 border-primary/20 focus:border-primary/50" placeholder="John Doe" {...field} />
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
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
              isLoading={isRegistering}
            >
              Create Account
            </PremiumButton>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
