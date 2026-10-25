import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { SELECT_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Shaymin extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 70;
  public weakness = [{ type: R }];
  public retreat: CardType[] = [];

  public attacks = [
    {
      name: 'Pinpoint Dive',
      cost: [G],
      damage: 0,
      text: 'This attack does 60 damage to 1 of your opponent\'s Benched Pokémon ex or Benched Pokémon V. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
    {
      name: 'Rear Kick',
      cost: [C, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '13';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Shaymin';
  public fullName: string = 'Shaymin TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // Only your opponent's Benched Pokémon ex and Benched Pokémon V are legal targets.
      const eligible = opponent.bench.filter(slot => {
        const card = slot.getPokemonCard();
        if (card === undefined) {
          return false;
        }
        return card.tags.includes(CardTag.POKEMON_ex) || card.tags.includes(CardTag.POKEMON_V);
      });

      if (eligible.length === 0) {
        return state;
      }

      const names: string[] = [];
      eligible.forEach(slot => {
        const card = slot.getPokemonCard();
        names.push(card ? card.name : '');
      });

      return SELECT_PROMPT(store, state, player, names, (index) => {
        const target = eligible[index];
        if (target === undefined) {
          return;
        }

        // PutDamageEffect: Benched Pokémon take the damage without Weakness / Resistance.
        const damageEffect = new PutDamageEffect(effect, 60);
        damageEffect.target = target;
        store.reduceEffect(state, damageEffect);
      });
    }

    return state;
  }
}
