import { Card } from './card';
import { Format, SuperType } from './card-types';

/** Transport-only placeholder. It is never registered in the playable card pool. */
export class UnknownCard extends Card {
  public set = '';
  public superType = SuperType.NONE;
  public format = Format.UNLIMITED;
  public fullName = 'Unknown';
  public name = 'Unknown';
}
