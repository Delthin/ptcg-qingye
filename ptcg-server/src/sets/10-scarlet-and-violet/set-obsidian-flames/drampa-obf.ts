import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Drampa extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [N];
  public hp: number = 120;
  public retreat = [C, C];

  public attacks = [{
    name: 'Outrage',
    cost: [C, C],
    damage: 60,
    damageCalculation: '+',
    text: 'This attack does 10 more damage for each damage counter on this Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '161';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Drampa';
  public fullName: string = 'Drampa OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() === this) {
          // cardList.damage is stored in HP; 10 HP = 1 damage counter
          const damageCounters = Math.floor(cardList.damage / 10);
          THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, damageCounters * 10);
        }
      });
    }

    return state;
  }
}
