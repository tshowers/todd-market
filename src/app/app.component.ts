import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initTheme } from '@taliferro/ui/platform/theme';

import { SoundService } from './services/sound.service';

@Component( {
  selector: 'tm-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
  styles: [':host { display: flex; flex-direction: column; min-height: 100dvh; }'],
} )
export class AppComponent {
  constructor () {
    // Re-applies a stored Light/Dark choice (index.html already did, before first paint).
    initTheme();
    // The universal menu's click sounds (taliferro-ui/sound).
    inject( SoundService );
  }
}
