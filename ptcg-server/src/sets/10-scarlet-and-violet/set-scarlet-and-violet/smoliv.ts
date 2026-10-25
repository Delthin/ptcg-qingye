import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, CardTarget, PlayerType, GameMessage, PokemonCardList, ChoosePokemonPrompt, SlotType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Smoliv extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.GRASS];
  public hp: number = 50;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS];

  public attacks = [{
    name: 'Tackle',
    cost: [CardType.COLORLESS, CardType.COLORLESS],
    damage: 30,
    text: ''
  }];

  public set: string = 'SVI';
  public regulationMark = 'G';
  public cardImage: string = 'assets/cardback.png';
  public fullName: string = 'Smoliv SVI';
  public name: string = 'Smoliv';
  public setNumber: string = '21';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const blocked: CardTarget[] = [];
      let hasPokemonWithDamage: boolean = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card, target) => {
        if (cardList.damage === 0) {
          blocked.push(target);
        } else {
          hasPokemonWithDamage = true;
        }
      });

      if (hasPokemonWithDamage === false) {
        return state;
      }

      // Do not discard the card yet
      effect.preventDefault = true;

      let targets: PokemonCardList[] = [];
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { allowCancel: false, blocked }
      ), results => {
        targets = results || [];
        if (targets.length === 0) {
          return state;
        }

        targets.forEach(target => {
          // Heal Pokemon
          const healEffect = new HealEffect(player, target, 30);
          store.reduceEffect(state, healEffect);
        });
        return state;
      });


    }

    return state;
  }
}
