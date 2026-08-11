import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ZonesComponent } from './components/zones/zones.component';
import { RecordsComponent } from './components/records/records.component';
import { ClientsComponent } from './components/clients/clients.component';
import { QueriesComponent } from './components/queries/queries.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: SidebarComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'zones', component: ZonesComponent },
      { path: 'records', component: RecordsComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'queries', component: QueriesComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
