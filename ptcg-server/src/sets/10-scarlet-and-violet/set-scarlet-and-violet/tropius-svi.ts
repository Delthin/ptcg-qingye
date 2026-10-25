import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Tropius extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.GRASS];
  public hp: number = 100;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Fresh-Picked Fruit',
      cost: [CardType.GRASS],
      damage: 0,
      text: 'Heal 60 damage from 1 of your Benched Pokémon.',
    },
    {
      name: 'Razor Leaf',
      cost: [CardType.GRASS, CardType.COLORLESS],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '7';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tropius';
  public fullName: string = 'Tropius SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const benched = player.bench.filter(b => b.cards.length > 0 && b.damage > 0);

      if (benched.length === 0) {
        return state;
      }

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: false, min: 1, max: 1 },
      ), results => {
        const targets = results || [];
        const target = targets[0];
        if (target === undefined) {
          return;
        }
        const healEffect = new HealEffect(player, target, 60);
        store.reduceEffect(state, healEffect);
      }) ?? state;
    }

    return state;
  }
}
