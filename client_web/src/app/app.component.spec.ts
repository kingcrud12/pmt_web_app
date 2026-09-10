import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let http: HttpTestingController;

  async function build() {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => localStorage.clear());

  it('n affiche pas la barre laterale sans session', async () => {
    localStorage.clear();
    await build();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeNull();
  });

  it('affiche la barre laterale une fois connecte', async () => {
    localStorage.setItem('pmt.user', JSON.stringify({
      id: '1', firstName: 'Alice', lastName: 'Durand', email: 'a@b.fr', createdAt: '',
    }));
    await build();
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-sidebar')).not.toBeNull();
  });
});
