import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED, BLOCK_IF_VSTAR_POWER_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_TYPE_ENERGY_FROM_YOUR_POKEMON } from '../../../game/store/prefabs/costs';

export class MewtwoVSTAR extends PokemonCard {
  public stage: Stage = Stage.VSTAR;
  public evolvesFrom = 'Mewtwo V';
  public cardType: CardType[] = [P];
  public hp: number = 280;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_VSTAR];

  public attacks = [
    {
      name: 'Psy Purge',
      cost: [P, C],
      damage: 90,
      damageCalculation: 'x',
      text: 'Discard up to 3 Psychic Energy from your Pokémon. This attack does 90 damage for each card you discarded in this way.',
    },
    {
      name: 'Star Raid',
      cost: [P, C],
      damage: 0,
      text: 'This attack does 120 damage to each of your opponent\'s Pokémon V. This damage isn\'t affected by Weakness or Resistance. (You can\'t use more than 1 VSTAR Power in a game.)',
    },
  ];

  public regulationMark = 'F';
  public set: string = 'PGO';
  public setNumber: string = '31';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mewtwo VSTAR';
  public fullName: string = 'Mewtwo VSTAR PGO';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DISCARD_UP_TO_X_TYPE_ENERGY_FROM_YOUR_POKEMON(
        store, state, effect, 3, CardType.PSYCHIC, 0, [SlotType.ACTIVE, SlotType.BENCH],
        transfers => {
          effect.damage = 90 * transfers.length;
        });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      BLOCK_IF_VSTAR_POWER_USED(effect.player);
      effect.player.usedVSTAR = true;
      effect.ignoreWeakness = true;
      effect.ignoreResistance = true;
      const opponent = effect.opponent;
      const targets = [opponent.active, ...opponent.bench].filter(list => {
        const card = list.getPokemonCard();
        return list.cards.length > 0 && card !== undefined && (
          card.tags.includes(CardTag.POKEMON_V)
          || card.tags.includes(CardTag.POKEMON_VMAX)
          || card.tags.includes(CardTag.POKEMON_VSTAR)
          || card.tags.includes(CardTag.POKEMON_VUNION)
        );
      });

      targets.forEach(target => {
        const damageEffect = new PutDamageEffect(effect, 120);
        damageEffect.target = target;
        store.reduceEffect(state, damageEffect);
      });
    }

    return state;
  }
}
