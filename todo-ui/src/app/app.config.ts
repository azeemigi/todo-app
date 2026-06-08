import { ApplicationConfig, Component, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './core/interceptors/error.interceptor';

@Component({ template: '' })
class SpaRouteComponent {}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter([{ path: '**', component: SpaRouteComponent }]),
    provideHttpClient(withInterceptors([errorInterceptor]))
  ]
};
