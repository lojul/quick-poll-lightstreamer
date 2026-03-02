import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import Index from "./pages/Index";
import Terms from "./pages/Terms";
import PaymentResult from "./pages/PaymentResult";
import PaymentHistory from "./pages/PaymentHistory";
import ExpiredPolls from "./pages/ExpiredPolls";
import ResetPassword from "./pages/ResetPassword";
import MyPolls from "./pages/MyPolls";
import PollPage from "./pages/PollPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SEO />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/payment" element={<PaymentResult />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/expired" element={<ExpiredPolls />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/my-polls" element={<MyPolls />} />
            <Route path="/poll/:id" element={<PollPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
