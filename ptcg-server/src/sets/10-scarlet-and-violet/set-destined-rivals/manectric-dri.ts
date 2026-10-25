import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Manectric extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Electrike';
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Zap Kick',
      cost: [C],
      damage: 30,
      text: ''
    },
    {
      name: 'Flash Impact',
      cost: [L, C],
      damage: 120,
      text: 'This attack also does 40 damage to 1 of your Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)'
    }
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '76';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Manectric';
  public fullName: string = 'Manectric DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const benched = player.bench.filter(b => b.cards.length > 0);

      if (benched.length === 0) {
        return state;
      }

      state = store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false },
      ), targets => {
        if (!targets || targets.length === 0) {
          return;
        }

        const damageEffect = new PutDamageEffect(effect, 40);
        damageEffect.target = targets[0];
        store.reduceEffect(state, damageEffect);
      }) ?? state;
    }

    return state;
  }
}
