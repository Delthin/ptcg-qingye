import { Card } from '../../../game/store/card/card';
import { Beldum } from './beldum';
import { BiancasDevotion } from './biancas-devotion';
import { Brambleghast } from './brambleghast';
import { Bramblin } from './bramblin';
import { Bronzor } from './bronzor';
import { Bronzong } from './bronzong';
import { BuddyBuddyPoffin } from './buddy-buddy-poffin';
import { AncientBoosterEnergyCapsuleTEF, FutureBoosterEnergyCapsuleTEF } from './other-prints';
import { Charjabug } from './charjabug';
import { Chatot } from './chatot';
import { Cinccino } from './cincinno';
import { Croconaw } from './croconaw';
import { DeliveryBox } from './delivery-box';
import { Drilbur } from './drilbur';
import { DrumsOfAwakening } from './drums-of-awakening';
import { Dudunsparce } from './dudunsparce';
import { Dunsparce } from './dunsparce';
import { Duosion } from './duosion';
import { EmergencyBoard } from './emergency-board';
import { Eri } from './eri';
import { ExplorersGuidance } from './explorers-guidance';
import { Farigirafex } from './farigiraf-ex';
import { Feraligatr } from './feraligatr';
import { FlutterMane } from './flutter-mane';
import { GrotleIR, CharjabugIR, BronzorIR, ReuniclusIR, GastlyIR, MetagrossIR, ChatotIR, MinccinoIR, CinccinoIR, TorterraexFA, IronLeavesexFA, GougingFireexFA, WalkingWakeexFA, IronCrownexFA, GengarexFA, RagingBoltexFA, BiancasDevotionFA, CryptomaniacsDecipheringFA, EriFA, ExplorersGuidanceFA, MortysConvictionFA, SalvatoreFA, IronLeavesexSIR, GougingFireexSIR, WalkingWakeexSIR, IronCrownexSIR, RagingBoltexSIR, BiancasDevotionSIR, EriSIR, MortysConvictionSIR, SalvatoreSIR, IronLeavesexHR, GougingFireexHR, WalkingWakeexHR, IronCrownexHR, RagingBoltexHR, RelicanthIR } from './full-art';
import { FullMetalLab } from './full-metal-lab';
import { Gastly } from './gastly';
import { Gengarex } from './gengar-ex';
import { Girafarig } from './girafarig';
import { GougingFireex } from './gouging-fire-ex';
import { GreatTusk } from './great-tusk';
import { GreatTusk2 } from './great-tusk-2';
import { Grotle } from './grotle';
import { Grubbin } from './grubbin';
import { HandTrimmer } from './hand-trimmer';
import { Haunter } from './haunter';
import { HeavyBaton } from './heavy-baton';
import { HerosCape } from './heros-cape';
import { Hoothoot } from './hoothoot';
import { Incineroarex } from './incineroar-ex';
import { IronCrownex } from './iron-crown-ex';
import { IronHands } from './iron-hands';
import { IronJugulis } from './iron-jugulis';
import { IronLeavesex } from './iron-leaves-ex';
import { IronThorns } from './iron-thorns';
import { Koraidon } from './koraidon';
import { Koraidonex } from './koraidon-ex';
import { Litten } from './litten';
import { MasterBall } from './master-ball';
import { MaximumBelt } from './maximum-belt';
import { Metagross } from './metagross';
import { Metang } from './metang';
import { Minccino } from './minccino';
import { Miraidon } from './miraidon';
import { Miraidonex } from './miraidon-ex';
import { MistEnergy } from './mist-energy';
import { MortysConviction } from './mortys-conviction';
import { MrMime } from './mr-mime';
import { NeoUpperEnergy } from './neo-upper-energy';
import { Palafin } from './palafin';
import { PerilousJungle } from './perilous-jungle';
import { Pidove } from './pidove';
import { Pikachu } from './pikachu';
import { PrimeCatcher } from './prime-catcher';
import { Rabsca } from './rabsca';
import { RagingBoltex } from './raging-bolt-ex';
import { Raichu } from './raichu';
import { RebootPod } from './reboot-pod';
import { Relicanth } from './relicanth';
import { Rellor } from './rellor';
import { Reuniclus } from './reuniclus';
import { RoaringMoon } from './roaring-moon';
import { Sableye } from './sableye';
import { Salvatore } from './salvatore';
import { SandyShocks } from './sandy-shocks';
import { Scizorex } from './scizor-ex';
import { Scovillainex } from './scovillain-ex';
import { Scyther } from './scyther';
import { Sizzlipede } from './sizzlipede';
import { Skitty } from './skitty';
import { Slugma } from './slugma';
import { Solosis } from './solosis';
import { Torracat } from './torracat';
import { Torterraex } from './torterra-ex';
import { Totodile } from './totodile';
import { Tranquill } from './tranquill';
import { Turtwig } from './turtwig';
import { Unfezant } from './unfezant';
import { Victini } from './victini';
import { Vikavolt } from './vikavolt';
import { WalkingWakeex } from './walking-wake-ex';
import { Wugtrioex } from './wugtrio-ex';
import { Zeraora } from './zeraora';
import { CiphermaniacsCodebreaking } from './cryptomaniacs-deciphering';
import { Sawsbuck } from './sawsbuck';
import { Whimsicott } from './whimsicott';
import { Lickitung } from './lickitung-tef';
import { Excadrill } from './excadrill-tef';
import { Deerling } from './deerling-tef';
import { Cutiefly } from './cutiefly-tef';
import { Mudsdale } from './mudsdale-tef';
import { Meltan } from './meltan-tef';
import { Snom } from './snom-tef';
import { Seedot } from './seedot-tef';
import { Nuzleaf } from './nuzleaf-tef';
import { Shroomish } from './shroomish-tef';
import { Breloom } from './breloom-tef';
import { Roselia } from './roselia-tef';
import { Roserade } from './roserade-tef';
import { Cottonee } from './cottonee-tef';
import { Dhelmise } from './dhelmise-tef';
import { Heatmor } from './heatmor-tef';
import { Centiskorch } from './centiskorch-tef';
import { Carvanha } from './carvanha-tef';
import { Sharpedo } from './sharpedo-tef';
import { Keldeo } from './keldeo-tef';
import { Frosmoth } from './frosmoth-tef';
import { Finizen } from './finizen-tef';
import { Electabuzz } from './electabuzz-tef';
import { Electivire } from './electivire-tef';
import { Ribombee } from './ribombee-tef';
import { IronValiant } from './iron-valiant-tef';
import { Meditite } from './meditite-tef';
import { Medicham } from './medicham-tef';
import { Golett } from './golett-tef';
import { Golurk } from './golurk-tef';
import { Mudbray } from './mudbray-tef';
import { Rolycoly } from './rolycoly-tef';
import { Carkol } from './carkol-tef';
import { Coalossal } from './coalossal-tef';
import { IronBoulderex } from './iron-boulder-ex-tef';
import { Ekans } from './ekans-tef';
import { Arbok } from './arbok-tef';
import { Poochyena } from './poochyena-tef';
import { Mightyena } from './mightyena-tef';
import { Mawile } from './mawile-tef';
import { Melmetal } from './melmetal-tef';
import { Lickilicky } from './lickilicky-tef';
import { Noctowl } from './noctowl-tef';
import { Drampa } from './drampa-tef';
import { Magcargo } from './magcargo-tef';
import { Shiftry } from './shiftry-tef';
import { Shaymin } from './shaymin-tef';
import { Wiglett } from './wiglett-tef';
import { ScreamTail } from './scream-tail-tef';
import { IronTreads } from './iron-treads-tef';
import { Delcatty } from './delcatty-tef';
import { Latias } from './latias-tef';
import { Marill } from './marill-tef';
import { Azumarill } from './azumarill-tef';
import { Rockruff } from './rockruff-tef';
import { Lycanroc } from './lycanroc-tef';
import { Yamper } from './yamper-tef';
import { Boltund } from './boltund-tef';
import { Ponyta } from './ponyta-tef';
import { Rapidash } from './rapidash-tef';
import { Pineco } from './pineco-tef';
import { Forretress } from './forretress-tef';
import { IronValiant2 } from './iron-valiant-79-tef';

export const setTemporalForces: Card[] = [

  new AncientBoosterEnergyCapsuleTEF(),
  new Beldum(),
  new BiancasDevotion(),
  new Brambleghast(),
  new Bramblin(),
  new Bronzor(),
  new Bronzong(),
  new BuddyBuddyPoffin(),
  new Charjabug(),
  new Chatot(),
  new Cinccino(),
  new Croconaw(),
  new CiphermaniacsCodebreaking(),
  new DeliveryBox(),
  new Drilbur(),
  new DrumsOfAwakening(),
  new Dudunsparce(),
  new Dunsparce(),
  new Duosion(),
  new EmergencyBoard(),
  new Eri(),
  new ExplorersGuidance(),
  new Feraligatr(),
  new FlutterMane(),
  new FullMetalLab(),
  new FutureBoosterEnergyCapsuleTEF(),
  new Gastly(),
  new Gengarex(),
  new GougingFireex(),
  new GreatTusk(),
  new Grotle(),
  new Grubbin(),
  new HandTrimmer(),
  new Haunter(),
  new HeavyBaton(),
  new HerosCape(),
  new Hoothoot(),
  new Incineroarex(),
  new IronCrownex(),
  new IronHands(),
  new IronJugulis(),
  new IronLeavesex(),
  new IronThorns(),
  new Koraidonex(),
  new Koraidon(),
  new Litten(),
  new MasterBall(),
  new MaximumBelt(),
  new Metagross(),
  new Metang(),
  new Minccino(),
  new Miraidonex(),
  new Miraidon(),
  new MistEnergy(),
  new MortysConviction(),
  new MrMime(),
  new NeoUpperEnergy(),
  new Palafin(),
  new PerilousJungle(),
  new Pidove(),
  new Pikachu(),
  new PrimeCatcher(),
  new Rabsca(),
  new RagingBoltex(),
  new Raichu(),
  new RebootPod(),
  new Relicanth(),
  new Rellor(),
  new Reuniclus(),
  new RoaringMoon(),
  new Sableye(),
  new Salvatore(),
  new SandyShocks(),
  new Sawsbuck(),
  new Whimsicott(),
  new Scovillainex(),
  new Sizzlipede(),
  new Skitty(),
  new Slugma(),
  new Solosis(),
  new Torracat(),
  new Torterraex(),
  new Totodile(),
  new Tranquill(),
  new Turtwig(),
  new Unfezant(),
  new Victini(),
  new Vikavolt(),
  new WalkingWakeex(),
  new Zeraora(),

  //FA
  new GrotleIR(),
  new CharjabugIR(),
  new BronzorIR(),
  new ReuniclusIR(),
  new RelicanthIR(),
  new GastlyIR(),
  new MetagrossIR(),
  new ChatotIR(),
  new MinccinoIR(),
  new CinccinoIR(),
  new TorterraexFA(),
  new IronLeavesexFA(),
  new GougingFireexFA(),
  new WalkingWakeexFA(),
  new IronCrownexFA(),
  new GengarexFA(),
  new RagingBoltexFA(),
  new BiancasDevotionFA(),
  new CryptomaniacsDecipheringFA(),
  new EriFA(),
  new ExplorersGuidanceFA(),
  new MortysConvictionFA(),
  new SalvatoreFA(),
  new IronLeavesexSIR(),
  new GougingFireexSIR(),
  new WalkingWakeexSIR(),
  new IronCrownexSIR(),
  new RagingBoltexSIR(),
  new BiancasDevotionSIR(),
  new EriSIR(),
  new MortysConvictionSIR(),
  new SalvatoreSIR(),
  new IronLeavesexHR(),
  new GougingFireexHR(),
  new WalkingWakeexHR(),
  new IronCrownexHR(),
  new RagingBoltexHR(),
  new Scyther(),
  new Scizorex(),
  new Wugtrioex(),
  new Girafarig(),
  new Farigirafex(),
  new GreatTusk2(),
  new Lickitung(),
  new Excadrill(),
  new Deerling(),
  new Cutiefly(),
  new Mudsdale(),
  new Meltan(),
  new Snom(),
  new Seedot(),
  new Nuzleaf(),
  new Shroomish(),
  new Breloom(),
  new Roselia(),
  new Roserade(),
  new Cottonee(),
  new Dhelmise(),
  new Heatmor(),
  new Centiskorch(),
  new Carvanha(),
  new Sharpedo(),
  new Keldeo(),
  new Frosmoth(),
  new Finizen(),
  new Electabuzz(),
  new Electivire(),
  new Ribombee(),
  new IronValiant(),
  new Meditite(),
  new Medicham(),
  new Golett(),
  new Golurk(),
  new Mudbray(),
  new Rolycoly(),
  new Carkol(),
  new Coalossal(),
  new IronBoulderex(),
  new Ekans(),
  new Arbok(),
  new Poochyena(),
  new Mightyena(),
  new Mawile(),
  new Melmetal(),
  new Lickilicky(),
  new Noctowl(),
  new Drampa(),
  new Magcargo(),
  new Shiftry(),
  new Shaymin(),
  new Wiglett(),
  new ScreamTail(),
  new IronTreads(),
  new Delcatty(),
  new Latias(),
  new Marill(),
  new Azumarill(),
  new Rockruff(),
  new Lycanroc(),
  new Yamper(),
  new Boltund(),
  new Ponyta(),
  new Rapidash(),
  new Pineco(),
  new Forretress(),
  new IronValiant2(),
];