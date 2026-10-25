import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HAS_MARKER, MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Mienshao extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Mienfoo';
  public cardType: CardType[] = [F];
  public hp: number = 100;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Three-Step Strike',
      cost: [F],
      damage: 20,
      damageCalculation: 'x',
      text: 'Flip 3 coins. This attack does 20 damage for each heads.',
    },
    {
      name: 'Whip Expert',
      cost: [C, C],
      damage: 50,
      damageCalculation: '+',
      text: 'If you attached a Pokémon Tool card from your hand to this Pokémon during this turn, this attack does 70 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '97';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mienshao';
  public fullName: string = 'Mienshao PAR';

  // Marker the engine puts on a Pokémon when a Pokémon Tool card was attached
  // to it from hand during the current turn.
  private readonly TOOL_ATTACHED_THIS_TURN = 'TOOL_ATTACHED_THIS_TURN';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Three-Step Strike: flip 3 coins, 20 damage for each heads.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      attackEffect.damage = 0;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, attackEffect.player, 3, results => {
        const heads = results.filter(result => result).length;
        attackEffect.damage = 20 * heads;
      });
    }

    // Whip Expert: 70 more damage if a Pokémon Tool was attached from hand to
    // this Pokémon during this turn.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const pokemon = effect.player.active;
      if (HAS_MARKER(this.TOOL_ATTACHED_THIS_TURN, pokemon)) {
        effect.damage += 70;
      }
    }

    return state;
  }
}
