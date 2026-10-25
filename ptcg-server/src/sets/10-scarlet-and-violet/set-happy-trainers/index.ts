import { Card } from '../../../game/store/card/card';
import { HappyTrainersElements } from './elements';
import { HappyTrainersUtility } from './utility';

// 简中嗨皮第六弹的新卡面；重复印刷统一由简中目录映射到这一份效果。
export const setHappyTrainers: Card[] = [
  ...HappyTrainersElements,
  ...HappyTrainersUtility,
];
