// 由 scripts/fetch-bgm.py 生成，请勿手改；改曲目请编辑脚本里的 THEMES。
// 音频文件是可选私人素材（src/assets/bgm/**）：缺失时前端按“无 BGM”静默降级。

export type BgmTrack = {
  file: string;
  title: string;
  game: string;
};

export type BgmTheme = {
  id: string;
  label: string;
  note: string;
  tracks: BgmTrack[];
};

export const BGM_THEMES: BgmTheme[] = [
  {
    id: "anime-theme",
    label: "动画主题曲",
    note: "动画片头片尾与官方中文歌",
    tracks: [
      {
        file: "01-mezase-pok-mon-master-20th-anniversary-p.mp3",
        title: "目标是宝可梦大师",
        game: "松本梨香 · 20 周年版",
      },
      {
        file: "02-alola-p.mp3",
        title: "阿罗拉!!",
        game: "松本梨香",
      },
      {
        file: "03-getta-banban-satoshi-with-pikachu-ver-p.mp3",
        title: "ゲッタバンバン",
        game: "松本梨香",
      },
      {
        file: "04-xy-z-p.mp3",
        title: "XY&Z",
        game: "松本梨香",
      },
      {
        file: "05-poke-mon-theme.mp3",
        title: "Pokémon Theme",
        game: "英文版主题曲",
      },
      {
        file: "06-tengger-target-pokemon-master.mp3",
        title: "目标是宝可梦大师（中文版）",
        game: "腾格尔 · 2024",
      },
      {
        file: "07-zhou-shen-ke-meng.mp3",
        title: "可梦",
        game: "周深 · 25 周年",
      },
    ],
  },
  {
    id: "pokemon-songs",
    label: "宝可梦之歌",
    note: "官方角色歌：呆呆兽、可达鸭们",
    tracks: [
      {
        file: "01-slowpoke-song.mp3",
        title: "你怎么搞的呀呆呆兽",
        game: "呆呆兽 · 官方 MV",
      },
      {
        file: "02-slowpoke-song-cn.mp3",
        title: "怎么回事呀？呆呆兽（中文版）",
        game: "呆呆兽 · 中文版",
      },
      {
        file: "03-psyduck-song-cn.mp3",
        title: "总裁可达鸭（中文版）",
        game: "可达鸭",
      },
      {
        file: "04-meowth-song.mp3",
        title: "爱捡拾的喵喵",
        game: "喵喵",
      },
      {
        file: "05-gengar-song.mp3",
        title: "夜幕下的耿鬼",
        game: "耿鬼",
      },
      {
        file: "06-ditto-song.mp3",
        title: "变变百变怪",
        game: "百变怪",
      },
      {
        file: "07-magikarp-song.mp3",
        title: "I LOVE 鲤鱼王",
        game: "鲤鱼王",
      },
      {
        file: "08-staryu-song.mp3",
        title: "我们的海星星",
        game: "海星星",
      },
    ],
  },
  {
    id: "pop-remix",
    label: "流行改编",
    note: "名曲的同人流行改编",
    tracks: [
      {
        file: "01-littleroot-light-arrange.mp3",
        title: "未白镇 · 轻音乐改编",
        game: "同人改编",
      },
      {
        file: "02-anime-theme-chinese-style.mp3",
        title: "动画主题曲 · 中国风改编",
        game: "同人改编",
      },
      {
        file: "03-lavender-town-guitar.mp3",
        title: "紫苑镇 · 治愈指弹",
        game: "同人改编",
      },
      {
        file: "04-smile-piano-arrange.mp3",
        title: "スマイル · 钢琴轻音乐改编",
        game: "同人改编",
      },
    ],
  },
  {
    id: "iconic-towns",
    label: "城镇名曲",
    note: "官方原声里传播广的曲子",
    tracks: [
      {
        file: "01-littleroot-town.mp3",
        title: "未白镇",
        game: "欧米加红宝石·阿尔法蓝宝石",
      },
      {
        file: "02-twinleaf-town-day.mp3",
        title: "双叶镇",
        game: "晶灿珍珠·明亮钻石",
      },
      {
        file: "03-jubilife-village.mp3",
        title: "祝庆村",
        game: "传说 阿尔宙斯",
      },
      {
        file: "04-hau-oli-city-day.mp3",
        title: "好奥乐市",
        game: "太阳·月亮",
      },
      {
        file: "05-wild-area-south.mp3",
        title: "旷野地带",
        game: "剑·盾",
      },
      {
        file: "06-poke-mon-center.mp3",
        title: "宝可梦中心",
        game: "剑·盾",
      },
    ],
  },
  {
    id: "modern-setpieces",
    label: "新作精选",
    note: "太晶、团体战与大会曲",
    tracks: [
      {
        file: "01-tera-raid-battle.mp3",
        title: "太晶团体战",
        game: "朱·紫",
      },
      {
        file: "02-battle-team-star.mp3",
        title: "天星队战",
        game: "朱·紫",
      },
      {
        file: "03-battle-final-tournament.mp3",
        title: "冠军杯决胜",
        game: "剑·盾",
      },
      {
        file: "04-max-raid-battle.mp3",
        title: "极巨团体战",
        game: "剑·盾",
      },
    ],
  },
  {
    id: "gym-leaders",
    label: "道馆主战",
    note: "Switch 与 3DS 世代的馆主战",
    tracks: [
      {
        file: "01-battle-gym-leader.mp3",
        title: "道馆馆主战",
        game: "剑·盾",
      },
      {
        file: "02-battle-gym-leader-victory-gym-leader.mp3",
        title: "道馆馆主战",
        game: "朱·紫",
      },
      {
        file: "03-battle-gym-leader.mp3",
        title: "道馆馆主战",
        game: "晶灿珍珠·明亮钻石",
      },
      {
        file: "04-battle-gym-leader.mp3",
        title: "道馆馆主战",
        game: "欧米加红宝石·阿尔法蓝宝石",
      },
      {
        file: "05-battle-island-kahuna.mp3",
        title: "岛屿之王战",
        game: "太阳·月亮",
      },
    ],
  },
  {
    id: "elite-champion",
    label: "冠军之路",
    note: "四天王与冠军的决胜曲",
    tracks: [
      {
        file: "01-battle-elite-four.mp3",
        title: "四天王战",
        game: "朱·紫",
      },
      {
        file: "02-battle-top-champion.mp3",
        title: "冠军战",
        game: "朱·紫",
      },
      {
        file: "03-decisive-battle-champion-leon.mp3",
        title: "冠军战",
        game: "剑·盾",
      },
      {
        file: "04-battle-champion.mp3",
        title: "冠军战",
        game: "晶灿珍珠·明亮钻石",
      },
      {
        file: "05-battle-champion.mp3",
        title: "冠军战",
        game: "欧米加红宝石·阿尔法蓝宝石",
      },
    ],
  },
];

export const DEFAULT_BGM_THEME = BGM_THEMES[0].id;

export function findBgmTheme(id: string | null | undefined): BgmTheme | null {
  return BGM_THEMES.find(theme => theme.id === id) ?? null;
}
