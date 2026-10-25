import { moveDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { ChoosePokemonPrompt, GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_DOES_LESS_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

type PokemonPromptOptions = NonNullable<ConstructorParameters<typeof ChoosePokemonPrompt>[4]>;
type PokemonPromptTarget = NonNullable<PokemonPromptOptions['blocked']>[number];

export class FlutterMane extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: M }];
  public retreat = [C];

  protected _tags = [CardTag.ANCIENT];

  public attacks = [
    {
      name: 'Perplexing Transfer',
      cost: [C, C],
      damage: 0,
      text: 'Move all damage counters from 1 of your Benched Ancient Pokémon to your opponent\'s Active Pokémon.'
    },
    {
      name: 'Moonblast',
      cost: [P, P],
      damage: 70,
      text: 'During your opponent\'s next turn, attacks used by the Defending Pokémon do 30 less damage (before applying Weakness and Resistance).'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '96';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Flutter Mane';
  public fullName: string = 'Flutter Mane SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const ancientBenched = player.bench.filter(slot => {
        const pokemonCard = slot.getPokemonCard();
        return pokemonCard !== undefined && pokemonCard.tags.includes(CardTag.ANCIENT);
      });

      if (ancientBenched.length === 0) {
        return state;
      }

      // Only Ancient Pokémon on the Bench are legal sources: block every other slot.
      const blocked: PokemonPromptTarget[] = [];
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, _card, target) => {
        const pokemonCard = cardList.getPokemonCard();
        if (pokemonCard === undefined || !pokemonCard.tags.includes(CardTag.ANCIENT)) {
          blocked.push(target);
        }
      });

      state = store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false, blocked }
      ), results => {
        const source = results && results[0];
        if (!source || !player.bench.includes(source) || !source.getPokemonCard()?.hasTag(CardTag.ANCIENT)) return;
        state = moveDamageCounters(store, state, player, source, opponent.active, source.damage, effect);
      }) ?? state;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DEFENDING_POKEMON_DOES_LESS_DAMAGE(store, state, effect, this, 30);
    }

    return state;
  }
}
