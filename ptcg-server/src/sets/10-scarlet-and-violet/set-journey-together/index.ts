import { Card } from '../../../game/store/card/card';
import { Accelgor } from './accelgor';
import { Bagon } from './bagon';
import { Banette } from './banette';
import { Beldum } from './beldum';
import { Blazikenex } from './blaziken-ex';
import { Bombirdier } from './bombirdier';
import { BrocksScouting } from './brocks-scouting';
import { Combusken } from './combusken';
import { Dudunsparceex } from './dudunsparce-ex';
import { Dunsparce } from './dunsparce';
import { Magearna } from './magearna';
import { RedeemableTicket } from './exchange-ticket';
import { Floragato } from './floragato';
import { HopsBag } from './hops-bag';
import { HopsChoiceBand } from './hops-choice-band';
import { HopsCorviknight } from './hops-corviknight';
import { HopsCorvisquire } from './hops-corvisquire';
import { HopsCramorant } from './hops-cramorant';
import { HopsDubwool } from './hops-dubwool';
import { HopsRookidee } from './hops-rookidee';
import { HopsSandaconda } from './hops-sandaconda';
import { HopsSilicobra } from './hops-silicobra';
import { HopsSnorlax } from './hops-snorlax';
import { HopsWooloo } from './hops-wooloo';
import { HopsZacianex } from './hops-zacian-ex';
import { IonosBelliboltex } from './ionos-bellibolt-ex';
import { IonosElectrode } from './ionos-electrode';
import { IonosKilowattrel } from './ionos-kilowattrel';
import { IonosTadbulb } from './ionos-tadbulb';
import { IonosVoltorb } from './ionos-voltorb';
import { IonosWattrel } from './ionos-wattrel';
import { IrisFightingSpirit } from './iris-fighting-spirit';
import { Larvitar } from './larvitar';
import { Levincia } from './levincia';
import { LilliesClefairyex } from './lillies-clefairy-ex';
import { LilliesComfey } from './lillies-comfey';
import { LilliesCutiefly } from './lillies-cutiefly';
import { LilliesPearl } from './lillies-pearl';
import { LilliesRibombee } from './lillies-ribombee';
import { Lilligant } from './lilligant';
import { Lombre } from './lombre';
import { Lotad } from './lotad';
import { Ludicolo } from './ludicolo';
import { Lycanroc } from './lycanroc';
import { Magmar } from './magmar';
import { Magmortar } from './magmortar';
import { Mamoswineex } from './mamoswine-ex';
import { Maractus } from './maractus';
import { Meowscarada } from './meowscarada';
import { Metagross } from './metagross';
import { Metang } from './metang';
import { NsCastle } from './ns-castle';
import { NsDarmanitan } from './ns-darmanitan';
import { NsDarumaka } from './ns-darumaka';
import { NsJoltik } from './ns-joltik';
import { NsKlang } from './ns-klang';
import { NsKlink } from './ns-klink';
import { NsKlinklang } from './ns-klinklang';
import { NsPPUp } from './ns-pp-up';
import { NsPurrloin } from './ns-purrloin';
import { NsReshiram } from './ns-reshiram';
import { NsSigilyph } from './ns-sigilyph';
import { NsZoroarkex } from './ns-zoroark-ex';
import { NsZorua } from './ns-zorua';
import { BlackBeltsTrainingJTG, BrocksRecruitmentFA, DudunsparceexFA, HopsWoolooIR, HopsZacianexSIR, IonosBelliboltexFA, IonosBelliboltexSIR, IonosBelliboltexUR, IonosKilowattrelIR, IrisFightingSpiritFA, LilliesClefairyexFA, LilliesClefairyexSIR, LilliesRibombeeIR, LycanrocIR, MamoswineexFA, MaractusIR, NsReshiramIR, NsZoroarkexFA, NsZoroarkexSIR, NsZoroarkexUR, ProfessorsResearchJTG, RuffianFA, SalamenceexFA, SalamenceexSIR, SpikeEnergyUR, SwinubIR, VolcanionexFA, VolcanionexSIR, WailordIR } from './other-prints';
import { Petilil } from './petilil';
import { Piloswine } from './piloswine';
import { Postwick } from './postwick';
import { Pupitar } from './pupitar';
import { Regirock } from './regirock';
import { Ruffian } from './ruffian';
import { Salamenceex } from './salamence-ex';
import { Shelgon } from './shelgon';
import { Shelmet } from './shelmet';
import { Shuppet } from './shuppet';
import { SpikyEnergy } from './spiky-energy';
import { Sprigatito } from './sprigatito';
import { Swinub } from './swinub';
import { TapuKokoex } from './tapu-koko-ex';
import { Toedscool } from './toedscool';
import { Torchic } from './torchic';
import { Tyranitar } from './tyranitar';
import { Volcanionex } from './volcanion-ex';
import { Wailmer } from './wailmer';
import { Wailord } from './wailord';
import { Butterfree } from './butterfree';
import { Rockruff } from './rockruff';
import { PaldeanWooper } from './paldean-wooper-jtg';
import { Articuno } from './articuno-jtg';
import { Sentret } from './sentret-jtg';
import { Furret } from './furret-jtg';
import { Noibat } from './noibat-jtg';
import { Noivern } from './noivern-jtg';
import { Foongus } from './foongus-jtg';
import { Reshiramex } from './reshiram-ex-jtg';
import { Amoongussex } from './amoonguss-ex-jtg';
import { Audino } from './audino-jtg';
import { Durant } from './durant-jtg';
import { Torkoal } from './torkoal-jtg';
import { Larvesta } from './larvesta-jtg';
import { Volcarona } from './volcarona-jtg';
import { Wingull } from './wingull-jtg';
import { Pelipper } from './pelipper-jtg';
import { Oricorio } from './oricorio-jtg';
import { GalarianStunfisk } from './galarian-stunfisk-jtg';
import { Tropius } from './tropius-jtg';
import { Drampa } from './drampa-jtg';
import { Cramorant } from './cramorant-jtg';
import { Lechonk } from './lechonk-jtg';
import { Oinkologne } from './oinkologne-jtg';
import { Squawkabilly } from './squawkabilly-jtg';
import { Caterpie } from './caterpie-jtg';
import { Metapod } from './metapod-jtg';
import { Paras } from './paras-jtg';
import { Parasect } from './parasect-jtg';
import { Karrablast } from './karrablast-jtg';
import { Remoraid } from './remoraid-jtg';
import { Octillery } from './octillery-jtg';
import { AlolanGeodude } from './alolan-geodude-jtg';
import { AlolanGraveler } from './alolan-graveler-jtg';
import { AlolanGolem } from './alolan-golem-jtg';
import { MrMime } from './mr-mime-jtg';
import { Pancham } from './pancham-jtg';
import { Pangoro } from './pangoro-jtg';
import { Escavalier } from './escavalier-jtg';
import { Cufant } from './cufant-jtg';
import { Copperajah } from './copperajah-jtg';
import { Mimikyuex } from './mimikyu-ex-jtg';
import { Regice } from './regice-jtg';
import { Impidimp } from './impidimp-jtg';
import { Morgrem } from './morgrem-jtg';
import { Grimmsnarl } from './grimmsnarl-jtg';
import { Toedscruel } from './toedscruel-jtg';
import { Skwovet } from './skwovet-jtg';
import { Greedent } from './greedent-jtg';
import { Dhelmise } from './dhelmise-jtg';
import { Kecleon } from './kecleon-jtg';
import { BillyONare } from './billy-onare-jtg';
import { Veluzaex } from './veluza-ex-jtg';
import { Klawf } from './klawf-jtg';
import { Koffing } from './koffing-jtg';
import { Weezing } from './weezing-jtg';
import { Druddigon } from './druddigon-jtg';
export const setJourneyTogether: Card[] = [

  new Magearna(),
  new Torchic(),
  new Combusken(),
  new Blazikenex(),
  new Bombirdier(),
  new Butterfree(),
  new TapuKokoex(),
  new Swinub(),
  new Piloswine(),
  new Mamoswineex(),
  new BrocksScouting(),
  new RedeemableTicket(),
  new Dunsparce(),
  new Dudunsparceex(),
  new Bagon(),
  new Shelgon(),
  new Salamenceex(),
  new Larvitar(),
  new Pupitar(),
  new Tyranitar(),
  new Magmar(),
  new Magmortar(),
  new Shuppet(),
  new Banette(),
  new Volcanionex(),
  new Sprigatito(),
  new Toedscool(),
  new Floragato(),
  new Meowscarada(),
  new IrisFightingSpirit(),
  new Wailmer(),
  new Wailord(),
  new Shelmet(),
  new Accelgor(),
  new Rockruff(),
  new Lycanroc(),
  new SpikyEnergy(),
  new Regirock(),
  new Maractus(),
  new Ruffian(),
  new Beldum(),
  new Metang(),
  new Metagross(),
  new Lilligant(),
  new Lotad(),
  new Lombre(),
  new Ludicolo(),
  new Petilil(),

  new LilliesClefairyex(),
  new LilliesComfey(),
  new LilliesPearl(),
  new LilliesCutiefly(),
  new LilliesRibombee(),

  new IonosTadbulb(),
  new IonosBelliboltex(),
  new IonosWattrel(),
  new IonosKilowattrel(),
  new IonosVoltorb(),
  new IonosElectrode(),
  new Levincia(),

  new HopsBag(),
  new HopsWooloo(),
  new HopsDubwool(),
  new HopsSnorlax(),
  new HopsCramorant(),
  new HopsRookidee(),
  new HopsCorvisquire(),
  new HopsCorviknight(),
  new HopsSilicobra(),
  new HopsSandaconda(),
  new HopsZacianex(),
  new HopsChoiceBand(),
  new Postwick(),

  new NsZorua(),
  new NsZoroarkex(),
  new NsReshiram(),
  new NsDarumaka(),
  new NsDarmanitan(),
  new NsPPUp(),
  new NsSigilyph(),
  new NsCastle(),
  new NsJoltik(),
  new NsPurrloin(),
  new NsKlink(),
  new NsKlang(),
  new NsKlinklang(),

  // Other prints
  new MaractusIR(),
  new WailordIR(),
  new IonosKilowattrelIR(),
  new LilliesRibombeeIR(),
  new SwinubIR(),
  new LycanrocIR(),
  new NsReshiramIR(),
  new HopsWoolooIR(),
  new VolcanionexFA(),
  new IonosBelliboltexFA(),
  new LilliesClefairyexFA(),
  new MamoswineexFA(),
  new NsZoroarkexFA(),
  new SalamenceexFA(),
  new DudunsparceexFA(),
  new IrisFightingSpiritFA(),
  new RuffianFA(),
  new BrocksRecruitmentFA(),
  new VolcanionexSIR(),
  new IonosBelliboltexSIR(),
  new LilliesClefairyexSIR(),
  new NsZoroarkexSIR(),
  new HopsZacianexSIR(),
  new SalamenceexSIR(),
  new IonosBelliboltexUR(),
  new NsZoroarkexUR(),
  new SpikeEnergyUR(),

  new ProfessorsResearchJTG(),
  new BlackBeltsTrainingJTG(),
  new PaldeanWooper(),
  new Articuno(),
  new Sentret(),
  new Furret(),
  new Noibat(),
  new Noivern(),
  new Foongus(),
  new Reshiramex(),
  new Amoongussex(),
  new Audino(),
  new Durant(),
  new Torkoal(),
  new Larvesta(),
  new Volcarona(),
  new Wingull(),
  new Pelipper(),
  new Oricorio(),
  new GalarianStunfisk(),
  new Tropius(),
  new Drampa(),
  new Cramorant(),
  new Lechonk(),
  new Oinkologne(),
  new Squawkabilly(),
  new Caterpie(),
  new Metapod(),
  new Paras(),
  new Parasect(),
  new Karrablast(),
  new Remoraid(),
  new Octillery(),
  new AlolanGeodude(),
  new AlolanGraveler(),
  new AlolanGolem(),
  new MrMime(),
  new Pancham(),
  new Pangoro(),
  new Escavalier(),
  new Cufant(),
  new Copperajah(),
  new Mimikyuex(),
  new Regice(),
  new Impidimp(),
  new Morgrem(),
  new Grimmsnarl(),
  new Toedscruel(),
  new Skwovet(),
  new Greedent(),
  new Dhelmise(),
  new Kecleon(),
  new BillyONare(),
  new Veluzaex(),
  new Klawf(),
  new Koffing(),
  new Weezing(),
  new Druddigon(),
];
