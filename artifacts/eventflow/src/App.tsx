import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import EventsList from "@/pages/events";
import EventDetail from "@/pages/event-detail";
import SponsorsList from "@/pages/sponsors";
import SuppliersList from "@/pages/suppliers";
import ContractsList from "@/pages/contracts";
import StaffList from "@/pages/staff";
import FinanceList from "@/pages/finance";
import RegistrationsList from "@/pages/registrations";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/events" component={EventsList} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/sponsors" component={SponsorsList} />
        <Route path="/suppliers" component={SuppliersList} />
        <Route path="/contracts" component={ContractsList} />
        <Route path="/staff" component={StaffList} />
        <Route path="/finance" component={FinanceList} />
        <Route path="/registrations" component={RegistrationsList} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
