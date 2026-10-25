import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
} from '../../../game/store/prefabs/prefabs';

export class Volbeat extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [CardType.GRASS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Quick Sign',
      cost: [CardType.COLORLESS],
      damage: 0,
      canUseOnFirstTurn: true,
      text: 'If you go first, you can use this attack during your first turn. Search your deck for up to 2 Basic Pokémon and put them onto your Bench. Then, shuffle your deck.'
    },
    {
      name: 'Coordinated Strike',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 20,
      damageCalculation: '+',
      text: 'If Illumise is on your Bench, this attack does 60 more damage.'
    }
  ];

  public regulationMark = 'H';

  public set: string = 'TWM';

  public setNumber: string = '9';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Volbeat';

  public fullName: string = 'Volbeat TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Quick Sign
    // Ref: set-paradox-rift/bombirdier-ex.ts (canUseOnFirstTurn + search deck for Basic Pokemon onto Bench)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      return SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(
        store, state, player, { stage: Stage.BASIC }, { min: 0, max: 2 },
      );
    }

    // Attack 2: Coordinated Strike
    // Ref: set-silver-tempest/keldeo.ts (bench Pokemon name check)
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const hasIllumise = player.bench.some(b => b.getPokemonCard()?.name === 'Illumise');
      if (hasIllumise) {
        return THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 60);
      }
    }

    return state;
  }

}
