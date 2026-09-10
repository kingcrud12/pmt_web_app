import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 40 40" fill="none" role="img"
         aria-label="PMT">
      <rect width="40" height="40" rx="10" [attr.fill]="onDark ? '#F2F1ED' : '#191A18'"></rect>
      <rect x="9" y="10.5" width="22" height="4.5" rx="2.25" fill="#14555F"></rect>
      <rect x="14" y="17.75" width="17" height="4.5" rx="2.25"
            [attr.fill]="onDark ? '#191A18' : '#F2F1ED'" [attr.opacity]="onDark ? 0.45 : 0.55"></rect>
      <rect x="9" y="25" width="12" height="4.5" rx="2.25"
            [attr.fill]="onDark ? '#191A18' : '#F2F1ED'" [attr.opacity]="onDark ? 0.2 : 0.28"></rect>
    </svg>
  `,
})
export class LogoComponent {
  @Input() size = 30;

  @Input() onDark = true;
}
