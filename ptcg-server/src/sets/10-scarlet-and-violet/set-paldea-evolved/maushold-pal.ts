import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PUT_X_DAMAGE_COUNTERS_ON_ALL_YOUR_OPPONENTS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Maushold extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Tandemaus';
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Gentle Slap',
      cost: [C, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Gnaw Relentlessly',
      cost: [C, C, C],
      damage: 0,
      text: 'Put 1 damage counter on each of your opponent\'s Pokémon for each of your Maushold in play.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '226';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Maushold';
  public fullName: string = 'Maushold PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      let mausholdInPlay = 0;
      [player.active, ...player.bench].forEach(cardList => {
        if (cardList.cards.length > 0 && cardList.getPokemonCard()?.name === 'Maushold') {
          mausholdInPlay += 1;
        }
      });

      if (mausholdInPlay > 0) {
        PUT_X_DAMAGE_COUNTERS_ON_ALL_YOUR_OPPONENTS_POKEMON(mausholdInPlay, store, state, effect);
      }
    }

    return state;
  }
}
