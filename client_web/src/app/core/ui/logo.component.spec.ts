import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LogoComponent] }).compileComponents();
    fixture = TestBed.createComponent(LogoComponent);
  });

  it('dessine la marque en SVG a la taille demandee', () => {
    fixture.componentInstance.size = 48;
    fixture.detectChanges();
    const svg: SVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('48');
    expect(svg.querySelectorAll('rect').length).toBe(4);
  });

  it('inverse le fond selon onDark', () => {
    fixture.componentInstance.onDark = true;
    fixture.detectChanges();
    const clair = fixture.nativeElement.querySelector('rect').getAttribute('fill');

    fixture.componentInstance.onDark = false;
    fixture.detectChanges();
    const sombre = fixture.nativeElement.querySelector('rect').getAttribute('fill');

    expect(clair).not.toBe(sombre);
  });
});
