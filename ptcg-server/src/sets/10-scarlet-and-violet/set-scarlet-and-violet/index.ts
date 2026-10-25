import { Card } from '../../../game/store/card/card';
import { Annihilape } from './annihilape';
import { Arboliva } from './arboliva';
import { Arcanineex } from './arcanine-ex';
import { Armarouge } from './armarouge';
import { Arven } from './arven';
import { Banetteex } from './banette-ex';
import { BeachCourt } from './beach-court';
import { Bisharp } from './bisharp';
import { Capsakid } from './capsakid';
import { Charcadet } from './charcadet';
import { CrushingHammer } from './crushing-hammer';
import { Cyclizar } from './cyclizar';
import { Croagunk } from './croagunk';
import { DefianceBand } from './defiance-band';
import { Dolliv } from './dolliv';
import { Dondozo } from './dondozo';
import { Drifloon } from './drifloon';
import { ElectricGenerator } from './electric-generator';
import { EnergyRetrieval } from './energy-retrieval';
import { EnergySearch } from './energy-search';
import { EnergySwitch } from './energy-switch';
import { ExpShare } from './exp-share';
import { Flittle } from './flittle';
import { ArmarougeIR, ArvenFA, ArvenSIR, FightingEnergyHR, LightningEnergyHR, GardevoirexFA, GardevoirexSIR, JacqFA, JacqSIR, KatyFA, KoraidonexFA, KoraidonexSIR, KoraidonexHR, MagnezoneexFA, MiraidonexFA, MiraidonexSIR, MiraidonexHR, MiriamFA, MiriamSIR, NestBallHR, PennyFA, PennySIR, ProfessorsResearchFA1, ProfessorsResearchFA2, RaltsIR, RareCandyHR, SkwovetIR, TeamStarGruntFA, KirliaIR, PawmotIR, SlowpokeIR } from './full-art';
import { Floragato } from './floragato';
import { Gardevoirex } from './gardevoir-ex';
import { Greedent } from './greedent';
import { Growlithe } from './growlithe';
import { Gyaradosex } from './gyarados-ex';
import { Hawlucha } from './hawlucha';
import { Jacq } from './jacq';
import { Judge } from './judge';
import { Katy } from './katy';
import { Kingambit } from './kingambit';
import { Klefki } from './klefki';
import { Koraidonex } from './koraidon-ex';
import { Lucario } from './lucario';
import { Magikarp } from './magikarp';
import { Magnemite } from './magnemite';
import { Magneton } from './magneton';
import { Magnezoneex } from './magnezone-ex';
import { Mankey } from './mankey';
import { Mareep } from './mareep';
import { Mesagoza } from './mesagoza';
import { Meowscarada } from './meowscarada';
import { Miraidonex } from './miraidon-ex';
import { Miriam } from './miriam';
import { Nemona } from './nemona';
import { NestBall } from './nest-ball';
import { PalPad } from './pal-pad';
import { Pawniard } from './pawniard';
import { Penny } from './penny';
import { PicnicBasket } from './picnic-basket';
import { Pokeball } from './pokeball';
import { Pokegear30 } from './pokegear-30';
import { PokemonCatcher } from './pokemon-catcher';
import { Potion } from './potion';
import { Primeape } from './primeape';
import { ProfessorsResearch } from './professors-research';
import { Quaxly } from './quaxly';
import { Quaxwell } from './quaxwell';
import { Ralts } from './ralts';
import { RareCandy } from './rare-candy';
import { Revavroom } from './revavroom';
import { Riolu } from './riolu';
import { Riolu2 } from './riolu2';
import { RockChestplate } from './rock-chestplate';
import { RockyHelmet } from './rocky-helmet';
import { Rotom } from './rotom';
import { Seviper } from './seviper';
import { Scatterbug } from './scatterbug';
import { Scovillain } from './scovillain';
import { Shuppet } from './shuppet';
import { Skwovet } from './skwovet';
//import { Slowbro } from './slowbro';
import { Smoliv } from './smoliv';
import { Spewpa } from './spewpa';
import { Spidopsex } from './spidops-ex';
import { Sprigatito } from './sprigatito';
import { Switch } from './switch';
import { TeamStarGrunt } from './team-star-grunt';
import { Toedscool } from './toedscool';
import { Toedscruel } from './toedscruel';
import { Torkoal } from './torkoal';
import { UltraBall } from './ultra-ball';
import { VitalityBand } from './vitality-band';
import { Wiglett } from './wiglett';
import { Wugtrio } from './wugtrio';
import { Youngster } from './youngster';
import { Kirlia } from './kirlia';
import { Pawmi } from './pawmi';
import { Pawmo } from './pawmo';
import { Pawmot } from './pawmot';
import { Slowpoke } from './slowpoke';
import { Fidough } from './fidough-svi';
import { Chansey } from './chansey-svi';
import { Lechonk } from './lechonk-svi';
import { Houndoom } from './houndoom-svi';
import { Pineco } from './pineco-svi';
import { Heracross } from './heracross-svi';
import { Cacnea } from './cacnea-svi';
import { Cacturne } from './cacturne-svi';
import { Tropius } from './tropius-svi';
import { Tarountula } from './tarountula-svi';
import { Houndour } from './houndour-svi';
import { Fuecoco } from './fuecoco-svi';
import { Crocalor } from './crocalor-svi';
import { Skeledirge } from './skeledirge-svi';
import { Alomomola } from './alomomola-svi';
import { Clauncher } from './clauncher-svi';
import { Clawitzer } from './clawitzer-svi';
import { Bruxish } from './bruxish-svi';
import { Quaquaval } from './quaquaval-svi';
import { Tatsugiri } from './tatsugiri-svi';
import { Pachirisu } from './pachirisu-svi';
import { Toxel } from './toxel-svi';
import { Toxtricity } from './toxtricity-svi';
import { Hypno } from './hypno-svi';
import { FlabB } from './flab-b-svi';
import { Floette } from './floette-svi';
import { Florges } from './florges-svi';
import { Dedenne } from './dedenne-svi';
import { Dachsbun } from './dachsbun-svi';
import { Espathra } from './espathra-svi';
import { Meditite } from './meditite-svi';
import { Medicham } from './medicham-svi';
import { Sandile } from './sandile-svi';
import { Krokorok } from './krokorok-svi';
import { Krookodile } from './krookodile-svi';
import { Silicobra } from './silicobra-svi';
import { Sandaconda } from './sandaconda-svi';
import { Stonjourner } from './stonjourner-svi';
import { GreatTuskex } from './great-tusk-ex-svi';
import { Bombirdier } from './bombirdier-svi';
import { Forretress } from './forretress-svi';
import { Varoom } from './varoom-svi';
import { IronTreadsex } from './iron-treads-ex-svi';
import { Indeedee } from './indeedee-svi';
import { Tandemaus } from './tandemaus-svi';
import { Maushold } from './maushold-svi';
import { Squawkabilly } from './squawkabilly-svi';
import { Vivillon } from './vivillon-svi';
import { Cetoddle } from './cetoddle-svi';
import { Cetitan } from './cetitan-svi';
import { Drifblim } from './drifblim-svi';
import { Klawf } from './klawf-svi';
import { Grimer } from './grimer-svi';
import { Muk } from './muk-svi';
import { Spiritomb } from './spiritomb-svi';
import { Maschiff } from './maschiff-svi';
import { Blissey } from './blissey-svi';
import { Starly } from './starly-svi';
import { Staravia } from './staravia-svi';
import { Staraptor } from './staraptor-svi';
import { Flaaffy } from './flaaffy-svi';
import { Wattrel } from './wattrel-svi';
import { Kilowattrel } from './kilowattrel-svi';
import { Zangoose } from './zangoose-svi';
import { Oinkologneex } from './oinkologne-ex-svi';
import { Skiddo } from './skiddo-svi';
import { Gogoat } from './gogoat-svi';
import { Buizel } from './buizel-svi';
import { Floatzel } from './floatzel-svi';
import { Flamigo } from './flamigo-svi';
import { Miraidon } from './miraidon-svi';
import { Breloom } from './breloom-svi';
import { Greavard } from './greavard-svi';
import { Shroomish } from './shroomish-svi';


export const setScarletAndViolet: Card[] = [
  new Annihilape(),
  new Arboliva(),
  new Arcanineex(),
  new Armarouge(),
  new Arven(),
  new BeachCourt(),
  new Bisharp(),
  new Capsakid(),
  new Charcadet(),
  new CrushingHammer(),
  new Croagunk(),
  new Cyclizar(),
  new DefianceBand(),
  new Dolliv(),
  new Dondozo(),
  new Drifloon(),
  new ElectricGenerator(),
  new EnergyRetrieval(),
  new EnergySearch(),
  new EnergySwitch(),
  new ExpShare(),
  new Flittle(),
  new Floragato(),
  new Gardevoirex(),
  new Greedent(),
  new Growlithe(),
  new Gyaradosex(),
  new Hawlucha(),
  new Jacq(),
  new Judge(),
  new Katy(),
  new Kingambit(),
  new Kirlia(),
  new Klefki(),
  new Koraidonex(),
  new Lucario(),
  new Magikarp(),
  new Magnemite(),
  new Magneton(),
  new Magnezoneex(),
  new Mankey(),
  new Mareep(),
  new Mesagoza(),
  new Meowscarada(),
  new Miraidonex(),
  new Miriam(),
  new Nemona(),
  new NestBall(),
  new PalPad(),
  new Pawmi(),
  new Pawmo(),
  new Pawmot(),
  new Pawniard(),
  new Penny(),
  new PicnicBasket(),
  new Pokeball(),
  new Pokegear30(),
  new PokemonCatcher(),
  new Potion(),
  new Primeape(),
  new ProfessorsResearch(),
  new Ralts(),
  new RareCandy(),
  new Revavroom(),
  new Riolu(),
  new Riolu2(),
  new RockChestplate(),
  new RockyHelmet(),
  new Rotom(),
  new Scatterbug(),
  new Scovillain(),
  new Seviper(),
  new Spewpa(),
  new Skwovet(),
  new Slowpoke(),
  //new Slowbro(),
  new Sprigatito(),
  new Switch(),
  new TeamStarGrunt(),
  new Torkoal(),
  new UltraBall(),
  new VitalityBand(),
  new Youngster(),
  new Banetteex(),
  new Shuppet(),
  new Spidopsex(),
  new Quaxly(),
  new Quaxwell(),

  //Alt-s
  new ArmarougeIR(),
  new PawmotIR(),
  new ArvenFA(),
  new ArvenSIR(),
  new FightingEnergyHR(),
  new LightningEnergyHR(),
  new GardevoirexFA(),
  new GardevoirexSIR(),
  new JacqFA(),
  new JacqSIR(),
  new KatyFA(),
  new KirliaIR(),
  new KoraidonexFA(),
  new KoraidonexSIR(),
  new KoraidonexHR(),
  new MagnezoneexFA(),
  new MiraidonexFA(),
  new MiraidonexSIR(),
  new MiraidonexHR(),
  new MiriamFA(),
  new MiriamSIR(),
  new NestBallHR(),
  new PennyFA(),
  new PennySIR(),
  new ProfessorsResearchFA1(),
  new ProfessorsResearchFA2(),
  new RaltsIR(),
  new RareCandyHR(),
  new SkwovetIR(),
  new SlowpokeIR(),
  new Smoliv(),
  new TeamStarGruntFA(),
  new Toedscool(),
  new Toedscruel(),
  new Wiglett(),
  new Wugtrio(),
  new Fidough(),
  new Chansey(),
  new Lechonk(),
  new Houndoom(),
  new Pineco(),
  new Heracross(),
  new Cacnea(),
  new Cacturne(),
  new Tropius(),
  new Tarountula(),
  new Houndour(),
  new Fuecoco(),
  new Crocalor(),
  new Skeledirge(),
  new Alomomola(),
  new Clauncher(),
  new Clawitzer(),
  new Bruxish(),
  new Quaquaval(),
  new Tatsugiri(),
  new Pachirisu(),
  new Toxel(),
  new Toxtricity(),
  new Hypno(),
  new FlabB(),
  new Floette(),
  new Florges(),
  new Dedenne(),
  new Dachsbun(),
  new Espathra(),
  new Meditite(),
  new Medicham(),
  new Sandile(),
  new Krokorok(),
  new Krookodile(),
  new Silicobra(),
  new Sandaconda(),
  new Stonjourner(),
  new GreatTuskex(),
  new Bombirdier(),
  new Forretress(),
  new Varoom(),
  new IronTreadsex(),
  new Indeedee(),
  new Tandemaus(),
  new Maushold(),
  new Squawkabilly(),
  new Vivillon(),
  new Cetoddle(),
  new Cetitan(),
  new Drifblim(),
  new Klawf(),
  new Grimer(),
  new Muk(),
  new Spiritomb(),
  new Maschiff(),
  new Blissey(),
  new Starly(),
  new Staravia(),
  new Staraptor(),
  new Flaaffy(),
  new Wattrel(),
  new Kilowattrel(),
  new Zangoose(),
  new Oinkologneex(),
  new Skiddo(),
  new Gogoat(),
  new Buizel(),
  new Floatzel(),
  new Flamigo(),
  new Miraidon(),
  new Breloom(),
  new Greavard(),
  new Shroomish(),
];
