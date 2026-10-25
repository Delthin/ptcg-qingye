import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';

export class Zekrom extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Crushing Short',
      cost: [C],
      damage: 20,
      text: 'Before doing damage, discard all Pokémon Tools from your opponent\'s Active Pokémon.',
    },
    {
      name: 'Raging Thunder',
      cost: [L, L, C],
      damage: 130,
      text: 'This attack also does 40 damage to 1 of your Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '66';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zekrom';
  public fullName: string = 'Zekrom PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Crushing Short: discard all Pokémon Tools from the opponent's Active Pokémon before damage.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const tools = opponent.active.tools.slice();

      if (tools.length > 0) {
        state = MOVE_CARDS(store, state, opponent.active, opponent.discard, { cards: tools });
      }
    }

    // Raging Thunder: also 40 damage to 1 of your Benched Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect = effect;
      const player = effect.player;
      const bench = player.bench.filter(b => b.cards.length > 0);

      if (bench.length === 0) {
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

        const damageEffect = new PutDamageEffect(attackEffect, 40);
        damageEffect.target = targets[0];
        store.reduceEffect(state, damageEffect);
      }) ?? state;
    }

    return state;
  }
}
