import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { CardType, EnergyType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike, SlotType, PlayerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_ENERGY_PROMPT,
  MULTIPLE_COIN_FLIPS_PROMPT,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Pachirisu extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Crackling Charge',
      cost: [C],
      damage: 0,
      text: 'Flip 3 coins. Attach a number of Basic [L] Energy cards up to the number of heads from your discard pile to your Benched Pokémon in any way you like.',
    },
    {
      name: 'Tiny Bolt',
      cost: [L, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '158';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pachirisu';
  public fullName: string = 'Pachirisu SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const basicLightningInDiscard = player.discard.cards.filter(card =>
        card instanceof EnergyCard
        && card.energyType === EnergyType.BASIC
        && card.provides.includes(L));

      if (basicLightningInDiscard.length === 0) {
        return state;
      }

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const heads = results.filter(result => result).length;

        if (heads === 0) {
          return;
        }

        state = ATTACH_ENERGY_PROMPT(store, state, player, PlayerType.BOTTOM_PLAYER, SlotType.DISCARD,
          [SlotType.BENCH], { energyType: EnergyType.BASIC, name: 'Lightning Energy' },
          { min: 0, max: heads, allowCancel: false });
      });
    }

    return state;
  }
}
