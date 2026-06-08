import { ApplicationConfig, Component, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

@Component({ template: '' })
class SpaRouteComponent {}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter([{ path: '**', component: SpaRouteComponent }]),
    provideHttpClient()
  ]
};
