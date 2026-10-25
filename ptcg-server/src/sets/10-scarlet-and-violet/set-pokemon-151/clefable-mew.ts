import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  IF_OPPONENTS_POKEMON_KO_BY_ATTACK_DAMAGE_TAKE_MORE_PRIZES,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Clefable extends PokemonCard {

  public regulationMark = 'G';

  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Clefairy';
  public cardType: CardType[] = [CardType.PSYCHIC];
  public hp: number = 100;
  public weakness = [{ type: CardType.METAL }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Follow Me',
      cost: [CardType.PSYCHIC],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot.',
    },
    {
      name: 'More Moon',
      cost: [CardType.PSYCHIC, CardType.PSYCHIC, CardType.PSYCHIC],
      damage: 50,
      text: 'If your opponent\'s Pokémon is Knocked Out by damage from this attack, take 1 more Prize card.',
    },
  ];

  public set: string = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '36';
  public name: string = 'Clefable';
  public fullName: string = 'Clefable MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Follow Me
    // Ref: set-fusion-strike/musharna.ts (Sleep Inducer - gust via SWITCH_IN_OPPONENT_BENCHED_POKEMON)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
    }

    // Attack 2: More Moon
    // Ref: set-silver-tempest/crobat.ts (Critical Bite - extra Prizes on KO by this attack)
    return IF_OPPONENTS_POKEMON_KO_BY_ATTACK_DAMAGE_TAKE_MORE_PRIZES(store, state, effect, this, {
      attackName: 'More Moon',
      extraPrizes: 1,
    });
  }

}
