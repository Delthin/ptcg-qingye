import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CONFIRMATION_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class IronTreadsex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 220;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [{
    name: 'Iron-Clad Roll',
    cost: [M, M, C],
    damage: 150,
    text: 'After doing damage, you may discard all Future Booster Energy Capsules from this Pokémon. If you do, during your opponent\'s next turn, this Pokémon takes 150 less damage from attacks (after applying Weakness and Resistance).'
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '66';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Iron Treads ex';
  public fullName: string = 'Iron Treads ex PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const source = player.active;
      const capsules = source.tools.filter(tool => tool.name === 'Future Booster Energy Capsule');

      // "You may" is only offered when at least one Future Booster Energy Capsule is attached.
      if (capsules.length > 0) {
        CONFIRMATION_PROMPT(store, state, player, result => {
          if (!result) {
            return;
          }

          capsules.forEach(capsule => {
            // Detach the tool from this Pokémon, then send it to the discard pile.
            const toolIndex = source.tools.indexOf(capsule);
            if (toolIndex !== -1) {
              source.tools.splice(toolIndex, 1);
            }

            const cardIndex = source.cards.indexOf(capsule);
            if (cardIndex !== -1) {
              source.cards.splice(cardIndex, 1);
            }

            player.discard.cards.push(capsule);
          });

          THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, 150);
        });
      }
    }

    return state;
  }
}
