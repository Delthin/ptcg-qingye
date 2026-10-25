import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_CANNOT_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Houndoomex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Houndour';
  public cardType: CardType[] = [D];
  public hp: number = 270;
  public weakness = [{ type: G }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Evil Claw',
      cost: [D, D],
      damage: 90,
      text: 'If the Defending Pokémon is a Basic Pokémon, it can\'t attack during your opponent\'s next turn.',
    },
    {
      name: 'Hound\'s Fang',
      cost: [D, D, D],
      damage: 220,
      text: 'This Pokémon also does 30 damage to itself.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '134';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndoom ex';
  public fullName: string = 'Houndoom ex OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const defending = effect.opponent.active.getPokemonCard();

      if (defending !== undefined && defending.stage === Stage.BASIC) {
        state = DEFENDING_POKEMON_CANNOT_ATTACK(store, state, effect, this);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
