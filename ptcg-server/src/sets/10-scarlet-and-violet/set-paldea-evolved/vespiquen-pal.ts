import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import {
  MOVE_CARDS, MULTIPLE_COIN_FLIPS_PROMPT, SHUFFLE_DECK, WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

// `ChoosePokemonPrompt` 的 `blocked` 选项要求 CardTarget[]，通过构造参数取到它的真实类型，
// 避免直接依赖 CardTarget 的导出位置。
type PokemonPromptOptions = NonNullable<ConstructorParameters<typeof ChoosePokemonPrompt>[4]>;
type BlockedTarget = NonNullable<PokemonPromptOptions['blocked']>;

export class Vespiquen extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Combee';
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Double Stab',
      cost: [C],
      damage: 30,
      damageCalculation: 'x',
      text: 'Flip 2 coins. This attack does 30 damage for each heads.',
    },
    {
      name: 'Order a Raid',
      cost: [G],
      damage: 120,
      text: 'Choose 1 of your Benched Combee and shuffle that Pokémon and all attached cards into your deck. If you can\'t shuffle a Combee into your deck, this attack does nothing.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '9';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Vespiquen';
  public fullName: string = 'Vespiquen PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Double Stab: flip 2 coins, 30 damage for each heads.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 30 * heads;
      });
    }

    // Order a Raid: choose 1 of your Benched Combee and shuffle it and all attached cards into your deck.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const benchedCombees = player.bench.filter(slot => {
        const pokemon = slot.getPokemonCard();
        return pokemon !== undefined && pokemon.name === 'Combee';
      });

      // If you can't shuffle a Combee into your deck, this attack does nothing.
      if (benchedCombees.length === 0) {
        effect.damage = 0;
        return state;
      }

      const blocked: BlockedTarget = [];
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, _card, target) => {
        const pokemon = cardList.getPokemonCard();
        if (pokemon === undefined || pokemon.name !== 'Combee') {
          blocked.push(target);
        }
      });

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false, blocked },
      ), targets => {
        const target = targets[0];
        const cards = target.cards.slice();

        state = MOVE_CARDS(store, state, target, player.deck, { cards });
        state = SHUFFLE_DECK(store, state, player);
      }) ?? state;
    }

    return state;
  }
}
