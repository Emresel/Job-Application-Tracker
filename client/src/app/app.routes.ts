import { Routes } from "@angular/router";
import { AdminComponent } from "./pages/admin/admin.component";
import { ApplicationsComponent } from "./pages/applications/applications.component";
import { CategoriesComponent } from "./pages/categories/categories.component";
import { CompaniesComponent } from "./pages/companies/companies.component";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";
import { RemindersComponent } from "./pages/reminders/reminders.component";
import { StatisticsComponent } from "./pages/statistics/statistics.component";
import { adminGuard } from "./core/guards";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "dashboard" },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },

  { path: "dashboard", component: DashboardComponent },
  { path: "statistics", component: StatisticsComponent },

  { path: "applications", component: ApplicationsComponent },
  { path: "companies", component: CompaniesComponent },
  { path: "categories", component: CategoriesComponent },
  { path: "reminders", component: RemindersComponent },

  { path: "admin", component: AdminComponent, canActivate: [adminGuard] },
  { path: "**", redirectTo: "dashboard" },
];
