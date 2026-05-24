import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { AppRouter } from "@/app/router/AppRouter";
import { ScrollToTop, BackToTopButton } from "@/shared/components/ScrollToTop";
import { CustomCursor } from "@/shared/components/CustomCursor";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CustomCursor />
          <ScrollToTop />
          <AppRouter />
          <BackToTopButton />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
