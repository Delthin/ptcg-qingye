import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EffectOfAbilityEffect } from '../../../game/store/effects/game-effects';

export class AntiqueOldAmber extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [];
  public resistance = [];
  public retreat: CardType[] = [];

  public powers = [{
    name: 'Amber Protection',
    powerType: PowerType.ABILITY,
    text: 'Prevent all effects of your opponent\'s Pokémon\'s Abilities done to this Pokémon.'
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '154';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Antique Old Amber';
  public fullName: string = 'Antique Old Amber MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Amber Protection: prevent all effects of the opponent's Pokémon's
    // Abilities done to this Pokémon.
    if (effect instanceof EffectOfAbilityEffect
      && effect.target !== undefined
      && effect.target.cards.includes(this)) {
      effect.preventDefault = true;
    }
    return state;
  }
}
