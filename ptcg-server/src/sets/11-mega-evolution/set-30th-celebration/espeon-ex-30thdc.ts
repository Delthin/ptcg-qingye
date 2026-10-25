import { Espeonex } from './espeon-ex';

// The 30thDC printing has Fighting Resistance, absent from the existing 30C card.
// Reuse Sunshine Beatdown without changing the other printing.
export class Espeonex30thDC extends Espeonex {
  public resistance = [{ type: F, value: -30 }];
  public setNumber: string = '014/040';
  public fullName: string = 'Espeon ex 30C 014/040';
}
