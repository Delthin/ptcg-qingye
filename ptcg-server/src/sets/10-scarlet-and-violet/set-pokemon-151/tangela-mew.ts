import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { Attack, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_MARKER,
  HAS_MARKER,
  REMOVE_MARKER_AT_END_OF_TURN,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

const ERIKAS_INVITATION = 'Erika\'s Invitation';
const PLAYED_ERIKAS_INVITATION_MARKER = 'PLAYED_ERIKAS_INVITATION_THIS_TURN';

// The engine emits a trainer-play effect when a Trainer card is played from hand; it carries
// `trainerCard` (the played card) and `player` (who played it). The shape is described
// structurally so this card does not depend on the concrete effect class.
type TrainerPlayEffect = Effect & {
  trainerCard?: { name: string };
  player?: {
    active: { cards: unknown[] };
    bench: { cards: unknown[] }[];
  };
};

export class TangelaMEW extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 80;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks: Attack[] = [
    {
      name: 'Tactful Tangling',
      cost: [G],
      damage: 10,
      damageCalculation: '+',
      text: 'If you played Erika\'s Invitation from your hand during this turn, this attack does 60 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '114';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tangela';
  public fullName: string = 'Tangela MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const trainerPlay = effect as TrainerPlayEffect;

    // Remember that this Tangela's owner played Erika's Invitation during this turn.
    if (trainerPlay.trainerCard !== undefined
      && trainerPlay.trainerCard.name === ERIKAS_INVITATION
      && trainerPlay.player !== undefined) {
      const player = trainerPlay.player;
      const isOwnedByPlayer = player.active.cards.includes(this)
        || player.bench.some(bench => bench.cards.includes(this));

      if (isOwnedByPlayer) {
        ADD_MARKER(PLAYED_ERIKAS_INVITATION_MARKER, this, this);
      }
    }

    if (WAS_ATTACK_USED(effect, 0, this)
      && HAS_MARKER(PLAYED_ERIKAS_INVITATION_MARKER, this, this)) {
      THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 60);
    }

    REMOVE_MARKER_AT_END_OF_TURN(effect, PLAYED_ERIKAS_INVITATION_MARKER, this);

    return state;
  }
}
