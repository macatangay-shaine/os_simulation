import assassinsCreedShadowsImage from '../../../assets/armoury-crate/promotion/assassins-creed-shadows.jpg'
import chromaGun2Image from '../../../assets/armoury-crate/content-platform/cover-chromagun-2.svg'
import masterOfCommandImage from '../../../assets/armoury-crate/promotion/master-of-command.jpg'
import newsTowerImage from '../../../assets/armoury-crate/promotion/news-tower.jpg'
import pragmataHeroImage from '../../../assets/armoury-crate/promotion/pragmata-hero.jpg'
import totalWarWarhammerImage from '../../../assets/armoury-crate/promotion/total-war-warhammer-3.jpg'

export const PROMOTION_STORAGE_KEY = 'jezos_armoury_promotion_state'

const steamAsset = (appId, assetName) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/${assetName}`

const steamCapsule = (appId) => steamAsset(appId, 'capsule_616x353.jpg')

const steamHeader = (appId) => steamAsset(appId, 'header.jpg')

const PROMOTION_NEWS_IMAGE_SOURCES = {
  'chromagun-2':
    'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/Xb0QKIDo7dCdSBzGTlwJMk8yjB6olpt4bDe83ouI.png',
  'pair-up-power-on': 'https://www.asus.com/events/eventES/eventspic/10599_1900.jpg',
  'upgrade-what-matters': 'https://www.asus.com/events/eventES/eventspic/10555_1900.jpg',
  'powered-by-asus': 'https://dlcdnwebimgs.asus.com/gain/ab7db71b-35b2-4c8d-820f-67b38d3ccf41/w880/h760/fwebp'
}

function createDeal({ id, title, image, fallbackImage = null, vipPrice, salePrice, discountLabel = null, searchTerms = [] }) {
  return {
    id,
    title,
    image,
    fallbackImage,
    vipPrice,
    salePrice,
    discountLabel,
    searchTerms
  }
}

function steamDeal({ appId, ...deal }) {
  return createDeal({
    ...deal,
    image: steamCapsule(appId),
    fallbackImage: steamHeader(appId)
  })
}

export const PROMOTION_TABS = [
  { id: 'game-deals', label: 'Game Deals' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'news', label: 'News' }
]

export const PROMOTION_GAME_DEAL_FILTERS = [
  { id: 'all-games', label: 'All Games' },
  { id: 'faq', label: 'FAQ' }
]

export const PROMOTION_FEATURED_DEAL = {
  id: 'pragmata',
  title: 'PRAGMATA',
  image: pragmataHeroImage,
  discountLabel: '-10%',
  priceLabel: '$53.99',
  searchTerms: ['pragmata', 'capcom', 'science fiction', 'featured']
}

export const PROMOTION_GAME_DEALS = [
  createDeal({
    id: 'assassins-creed-shadows',
    title: "Assassin's Creed Shadows",
    image: assassinsCreedShadowsImage,
    vipPrice: '$30.20',
    salePrice: '$31.79',
    discountLabel: '-55%',
    searchTerms: ['assassins creed', 'shadows', 'ubisoft', 'open world', 'samurai']
  }),
  createDeal({
    id: 'total-war-warhammer-3',
    title: 'Total War: WARHAMMER III',
    image: totalWarWarhammerImage,
    vipPrice: '$13.29',
    salePrice: '$13.99',
    discountLabel: '-77%',
    searchTerms: ['total war', 'warhammer', 'strategy', 'creative assembly']
  }),
  createDeal({
    id: 'news-tower',
    title: 'News Tower',
    image: newsTowerImage,
    vipPrice: '$14.67',
    salePrice: '$15.44',
    discountLabel: '-38%',
    searchTerms: ['news tower', 'management', 'simulation', 'newspaper']
  }),
  createDeal({
    id: 'master-of-command',
    title: 'Master of Command',
    image: masterOfCommandImage,
    vipPrice: '$22.79',
    salePrice: '$23.99',
    discountLabel: '-20%',
    searchTerms: ['master of command', 'strategy', 'tactics', 'history']
  }),
  steamDeal({
    id: 'europa-universalis-v',
    title: 'Europa Universalis V',
    appId: 3450310,
    vipPrice: '$42.74',
    salePrice: '$44.99',
    discountLabel: '-25%',
    searchTerms: ['europa universalis', 'paradox', 'grand strategy', 'history']
  }),
  steamDeal({
    id: 'blue-prince',
    title: 'Blue Prince',
    appId: 1569580,
    vipPrice: '$16.87',
    salePrice: '$17.76',
    discountLabel: '-41%',
    searchTerms: ['blue prince', 'mystery', 'strategy', 'puzzle']
  }),
  steamDeal({
    id: 'cairn',
    title: 'Cairn',
    appId: 1588550,
    vipPrice: '$19.86',
    salePrice: '$20.91',
    discountLabel: '-30%',
    searchTerms: ['cairn', 'climbing', 'adventure', 'simulation']
  }),
  steamDeal({
    id: 'menace',
    title: 'MENACE',
    appId: 2432860,
    vipPrice: '$28.49',
    salePrice: '$29.99',
    discountLabel: '-25%',
    searchTerms: ['menace', 'tactical', 'rpg', 'strategy']
  }),
  steamDeal({
    id: 'space-marine-2',
    title: 'Warhammer 40,000: Space Marine 2',
    appId: 2183900,
    vipPrice: '$18.53',
    salePrice: '$19.50',
    discountLabel: '-67%',
    searchTerms: ['space marine 2', 'warhammer 40000', 'action', 'shooter']
  }),
  steamDeal({
    id: 'resident-evil-5-gold',
    title: 'Resident Evil 5 Gold Edition',
    appId: 21690,
    vipPrice: '$4.49',
    salePrice: '$4.73',
    discountLabel: '-76%',
    searchTerms: ['resident evil 5', 'gold edition', 'capcom', 'co-op']
  }),
  steamDeal({
    id: 'tides-of-torment',
    title: 'Total War: WARHAMMER III - Tides of Torment',
    appId: 3450970,
    vipPrice: '$16.64',
    salePrice: '$17.52',
    discountLabel: '-24%',
    searchTerms: ['tides of torment', 'total war', 'warhammer iii', 'dlc']
  }),
  steamDeal({
    id: 'resident-evil-6-complete',
    title: 'Resident Evil 6 Complete Pack',
    appId: 221040,
    vipPrice: '$4.49',
    salePrice: '$4.73',
    discountLabel: '-76%',
    searchTerms: ['resident evil 6', 'complete pack', 'capcom', 'action']
  })
]

export const PROMOTION_GAMESPLANET_DEALS = [
  steamDeal({
    id: 'tropico-6',
    title: 'Tropico 6',
    appId: 492720,
    vipPrice: '$12.21',
    salePrice: '$12.85',
    discountLabel: '-68%',
    searchTerms: ['tropico 6', 'gamesplanet', 'city builder', 'dictator']
  }),
  steamDeal({
    id: 'the-surge-2',
    title: 'The Surge 2',
    appId: 644830,
    vipPrice: '$3.79',
    salePrice: '$3.99',
    discountLabel: '-87%',
    searchTerms: ['the surge 2', 'gamesplanet', 'action rpg', 'soulslike']
  }),
  steamDeal({
    id: 'eternity-the-last-unicorn',
    title: 'Eternity: The Last Unicorn',
    appId: 714250,
    vipPrice: '$1.73',
    salePrice: '$1.82',
    discountLabel: '-91%',
    searchTerms: ['eternity', 'the last unicorn', 'gamesplanet', 'rpg']
  })
]

export const PROMOTION_AURA_READY_DEALS = [
  steamDeal({
    id: 'strayed-lights',
    title: 'Strayed Lights',
    appId: 2162020,
    vipPrice: '$3.19',
    salePrice: '$3.36',
    discountLabel: '-74%',
    searchTerms: ['strayed lights', 'aura ready', 'rgb', 'action adventure']
  }),
  steamDeal({
    id: 'ultimate-zombie-defense',
    title: 'Ultimate Zombie Defense',
    appId: 1035510,
    vipPrice: '$4.74',
    salePrice: '$4.99',
    searchTerms: ['ultimate zombie defense', 'aura ready', 'rgb', 'co-op']
  }),
  steamDeal({
    id: 'song-of-horror',
    title: 'Song of Horror',
    appId: 1096570,
    vipPrice: '$9.46',
    salePrice: '$9.96',
    discountLabel: '-67%',
    searchTerms: ['song of horror', 'aura ready', 'rgb', 'survival horror']
  }),
  steamDeal({
    id: 'ghostrunner',
    title: 'Ghostrunner',
    appId: 1139900,
    vipPrice: '$6.08',
    salePrice: '$6.40',
    discountLabel: '-79%',
    searchTerms: ['ghostrunner', 'aura ready', 'rgb', 'cyberpunk']
  }),
  steamDeal({
    id: 'double-kick-heroes',
    title: 'Double Kick Heroes',
    appId: 589670,
    vipPrice: '$5.45',
    salePrice: '$5.74',
    discountLabel: '-71%',
    searchTerms: ['double kick heroes', 'aura ready', 'rgb', 'rhythm']
  }),
  steamDeal({
    id: 'genesis-alpha-one',
    title: 'Genesis Alpha One',
    appId: 712190,
    vipPrice: '$3.45',
    salePrice: '$3.63',
    discountLabel: '-82%',
    searchTerms: ['genesis alpha one', 'aura ready', 'rgb', 'science fiction']
  })
]

export const PROMOTION_OFFER_HIGHLIGHTS = [
  steamDeal({
    id: 'resident-evil-4-gold',
    title: 'Resident Evil 4 Gold Edition',
    appId: 2050650,
    vipPrice: '$17.35',
    salePrice: '$18.26',
    discountLabel: '-63%',
    searchTerms: ['resident evil 4', 'gold edition', 'offer highlights', 'capcom']
  }),
  steamDeal({
    id: 'tempest-rising',
    title: 'Tempest Rising',
    appId: 1486920,
    vipPrice: '$21.19',
    salePrice: '$22.31',
    discountLabel: '-44%',
    searchTerms: ['tempest rising', 'offer highlights', 'rts']
  }),
  steamDeal({
    id: 'avatar-frontiers-of-pandora',
    title: 'Avatar: Frontiers of Pandora',
    appId: 2840770,
    vipPrice: '$16.92',
    salePrice: '$17.81',
    discountLabel: '-41%',
    searchTerms: ['avatar', 'frontiers of pandora', 'offer highlights', 'ubisoft']
  }),
  steamDeal({
    id: 'great-ace-attorney-chronicles',
    title: 'The Great Ace Attorney Chronicles',
    appId: 1158850,
    vipPrice: '$13.92',
    salePrice: '$14.65',
    discountLabel: '-63%',
    searchTerms: ['ace attorney', 'great ace attorney chronicles', 'offer highlights']
  }),
  steamDeal({
    id: 'clair-obscur-expedition-33',
    title: 'Clair Obscur: Expedition 33',
    appId: 1903340,
    vipPrice: '$36.09',
    salePrice: '$37.99',
    discountLabel: '-24%',
    searchTerms: ['clair obscur', 'expedition 33', 'offer highlights']
  }),
  steamDeal({
    id: 'gtfo',
    title: 'GTFO',
    appId: 493520,
    vipPrice: '$11.39',
    salePrice: '$11.99',
    discountLabel: '-70%',
    searchTerms: ['gtfo', 'offer highlights', 'co-op shooter']
  }),
  steamDeal({
    id: 'mio-memories-in-orbit',
    title: 'MIO: Memories in Orbit',
    appId: 1672810,
    vipPrice: '$13.86',
    salePrice: '$14.59',
    discountLabel: '-27%',
    searchTerms: ['mio', 'memories in orbit', 'offer highlights', 'metroidvania']
  }),
  steamDeal({
    id: 'assetto-corsa-rally',
    title: 'Assetto Corsa Rally',
    appId: 3917090,
    vipPrice: '$18.97',
    salePrice: '$19.97',
    discountLabel: '-33%',
    searchTerms: ['assetto corsa rally', 'offer highlights', 'racing']
  }),
  steamDeal({
    id: 'no-mans-sky',
    title: "No Man's Sky",
    appId: 275850,
    vipPrice: '$18.97',
    salePrice: '$19.97',
    discountLabel: '-67%',
    searchTerms: ['no mans sky', 'offer highlights', 'space']
  }),
  steamDeal({
    id: 'monster-hunter-wilds',
    title: 'Monster Hunter Wilds',
    appId: 2246340,
    vipPrice: '$33.19',
    salePrice: '$34.94',
    discountLabel: '-50%',
    searchTerms: ['monster hunter wilds', 'offer highlights', 'capcom']
  }),
  steamDeal({
    id: 'digimon-story-cyber-sleuth',
    title: 'Digimon Story Cyber Sleuth: Complete Edition',
    appId: 1042550,
    vipPrice: '$4.23',
    salePrice: '$4.45',
    discountLabel: '-91%',
    searchTerms: ['digimon', 'cyber sleuth', 'complete edition', 'offer highlights']
  }),
  steamDeal({
    id: 'resident-evil-2',
    title: 'Resident Evil 2',
    appId: 883710,
    vipPrice: '$8.78',
    salePrice: '$9.24',
    discountLabel: '-77%',
    searchTerms: ['resident evil 2', 'offer highlights', 'capcom']
  }),
  createDeal({
    id: 'resident-evil-remake-trilogy',
    title: 'Resident Evil Remake Trilogy',
    image: null,
    vipPrice: '$31.06',
    salePrice: '$32.69',
    discountLabel: '-64%',
    searchTerms: ['resident evil remake trilogy', 'offer highlights', 'capcom', 'collection']
  }),
  steamDeal({
    id: 'sonic-racing-crossworlds',
    title: 'Sonic Racing: CrossWorlds',
    appId: 2486820,
    vipPrice: '$37.81',
    salePrice: '$39.80',
    discountLabel: '-43%',
    searchTerms: ['sonic racing', 'crossworlds', 'offer highlights', 'sega']
  }),
  steamDeal({
    id: 'sonic-x-shadow-generations',
    title: 'Sonic X Shadow Generations',
    appId: 2513280,
    vipPrice: '$18.04',
    salePrice: '$18.99',
    discountLabel: '-62%',
    searchTerms: ['sonic x shadow generations', 'offer highlights', 'sega']
  }),
  steamDeal({
    id: 'tabletop-game-shop-simulator',
    title: 'Tabletop Game Shop Simulator',
    appId: 3524750,
    vipPrice: '$7.03',
    salePrice: '$7.40',
    discountLabel: '-43%',
    searchTerms: ['tabletop game shop simulator', 'offer highlights', 'simulation']
  }),
  steamDeal({
    id: 'trailmakers',
    title: 'Trailmakers',
    appId: 585420,
    vipPrice: '$5.04',
    salePrice: '$5.30',
    discountLabel: '-79%',
    searchTerms: ['trailmakers', 'offer highlights', 'sandbox']
  }),
  steamDeal({
    id: 'we-love-katamari-reroll',
    title: 'We Love Katamari REROLL+ Royal Reverie',
    appId: 1730700,
    vipPrice: '$6.23',
    salePrice: '$6.56',
    discountLabel: '-78%',
    searchTerms: ['katamari', 'we love katamari', 'royal reverie', 'offer highlights']
  }),
  steamDeal({
    id: 'ixion',
    title: 'IXION',
    appId: 1113120,
    vipPrice: '$9.40',
    salePrice: '$9.89',
    discountLabel: '-72%',
    searchTerms: ['ixion', 'offer highlights', 'strategy']
  }),
  steamDeal({
    id: 'age-of-empires-ii',
    title: 'Age of Empires II: Definitive Edition',
    appId: 813780,
    vipPrice: '$9.40',
    salePrice: '$9.89',
    discountLabel: '-72%',
    searchTerms: ['age of empires', 'age of empires ii', 'offer highlights', 'strategy']
  }),
  steamDeal({
    id: 'shinobi-art-of-vengeance',
    title: 'SHINOBI: Art of Vengeance',
    appId: 2361770,
    vipPrice: '$16.32',
    salePrice: '$17.18',
    discountLabel: '-43%',
    searchTerms: ['shinobi', 'art of vengeance', 'offer highlights', 'sega']
  }),
  steamDeal({
    id: 'let-them-trade',
    title: 'Let Them Trade',
    appId: 1313290,
    vipPrice: '$6.95',
    salePrice: '$7.32',
    discountLabel: '-59%',
    searchTerms: ['let them trade', 'offer highlights', 'city builder']
  }),
  steamDeal({
    id: 'company-of-heroes-3',
    title: 'Company of Heroes 3',
    appId: 1677280,
    vipPrice: '$20.42',
    salePrice: '$21.49',
    discountLabel: '-64%',
    searchTerms: ['company of heroes 3', 'offer highlights', 'strategy']
  }),
  steamDeal({
    id: 'far-cry-3',
    title: 'Far Cry 3',
    appId: 220240,
    vipPrice: '$4.49',
    salePrice: '$4.73',
    discountLabel: '-76%',
    searchTerms: ['far cry 3', 'offer highlights', 'ubisoft']
  }),
  steamDeal({
    id: 'roadcraft',
    title: 'RoadCraft',
    appId: 2104890,
    vipPrice: '$24.30',
    salePrice: '$25.58',
    discountLabel: '-36%',
    searchTerms: ['roadcraft', 'offer highlights', 'construction']
  }),
  steamDeal({
    id: 'astria-ascending',
    title: 'Astria Ascending',
    appId: 1121780,
    vipPrice: '$2.79',
    salePrice: '$2.94',
    discountLabel: '-92%',
    searchTerms: ['astria ascending', 'offer highlights', 'jrpg']
  }),
  steamDeal({
    id: 'ni-no-kuni-2',
    title: 'Ni no Kuni II: Revenant Kingdom',
    appId: 589360,
    vipPrice: '$7.92',
    salePrice: '$8.34',
    discountLabel: '-86%',
    searchTerms: ['ni no kuni ii', 'revenant kingdom', 'offer highlights']
  }),
  steamDeal({
    id: 'total-war-three-kingdoms',
    title: 'Total War: THREE KINGDOMS',
    appId: 779340,
    vipPrice: '$10.95',
    salePrice: '$11.53',
    discountLabel: '-81%',
    searchTerms: ['total war three kingdoms', 'offer highlights', 'strategy']
  }),
  steamDeal({
    id: 'outcast-2',
    title: 'Outcast 2',
    appId: 1013140,
    vipPrice: '$7.70',
    salePrice: '$8.11',
    discountLabel: '-80%',
    searchTerms: ['outcast 2', 'offer highlights', 'action adventure']
  }),
  steamDeal({
    id: 'south-park-stick-of-truth',
    title: 'South Park: The Stick of Truth',
    appId: 213670,
    vipPrice: '$6.64',
    salePrice: '$6.99',
    discountLabel: '-77%',
    searchTerms: ['south park', 'stick of truth', 'offer highlights']
  }),
  steamDeal({
    id: 'assassins-creed-revelations',
    title: "Assassin's Creed Revelations",
    appId: 201870,
    vipPrice: '$5.35',
    salePrice: '$5.63',
    discountLabel: '-72%',
    searchTerms: ['assassins creed revelations', 'offer highlights', 'ubisoft']
  }),
  steamDeal({
    id: 'scarlet-nexus-ultimate',
    title: 'Scarlet Nexus Ultimate Edition',
    appId: 775500,
    vipPrice: '$12.26',
    salePrice: '$12.91',
    discountLabel: '-87%',
    searchTerms: ['scarlet nexus', 'ultimate edition', 'offer highlights']
  }),
  steamDeal({
    id: 'football-manager-26',
    title: 'Football Manager 26',
    appId: 3551340,
    vipPrice: '$36.09',
    salePrice: '$37.99',
    discountLabel: '-37%',
    searchTerms: ['football manager 26', 'offer highlights', 'sega']
  }),
  steamDeal({
    id: 'yakuza-kiwami',
    title: 'Yakuza Kiwami',
    appId: 834530,
    vipPrice: '$12.74',
    salePrice: '$13.41',
    discountLabel: '-33%',
    searchTerms: ['yakuza kiwami', 'offer highlights', 'sega']
  }),
  steamDeal({
    id: 'pioneers-of-pagonia',
    title: 'Pioneers of Pagonia',
    appId: 2155180,
    vipPrice: '$21.60',
    salePrice: '$22.74',
    discountLabel: '-35%',
    searchTerms: ['pioneers of pagonia', 'offer highlights', 'strategy']
  }),
  steamDeal({
    id: 'division-2-ultimate',
    title: "Tom Clancy's The Division 2 Ultimate Edition",
    appId: 2221490,
    vipPrice: '$24.20',
    salePrice: '$25.47',
    discountLabel: '-64%',
    searchTerms: ['division 2', 'ultimate edition', 'offer highlights', 'ubisoft']
  }),
  steamDeal({
    id: 'shin-megami-tensei-v-vengeance',
    title: 'Shin Megami Tensei V: Vengeance',
    appId: 1875830,
    vipPrice: '$18.99',
    salePrice: '$19.99',
    discountLabel: '-67%',
    searchTerms: ['shin megami tensei v vengeance', 'offer highlights', 'atlus']
  }),
  steamDeal({
    id: 'all-under-heaven',
    title: 'Crusader Kings III: All Under Heaven',
    appId: 3315530,
    vipPrice: '$21.54',
    salePrice: '$22.67',
    discountLabel: '-24%',
    searchTerms: ['all under heaven', 'crusader kings iii', 'offer highlights', 'paradox']
  }),
  steamDeal({
    id: 'remnant-2-ultimate',
    title: 'Remnant II Ultimate Edition',
    appId: 1282100,
    vipPrice: '$13.29',
    salePrice: '$13.99',
    discountLabel: '-80%',
    searchTerms: ['remnant 2', 'ultimate edition', 'offer highlights']
  }),
  steamDeal({
    id: 'for-honor',
    title: 'For Honor',
    appId: 304390,
    vipPrice: '$4.07',
    salePrice: '$4.28',
    discountLabel: '-86%',
    searchTerms: ['for honor', 'offer highlights', 'ubisoft']
  }),
  createDeal({
    id: 'scent-of-the-black-manor',
    title: 'The Scent of the Black Manor',
    image: null,
    vipPrice: '$12.83',
    salePrice: '$13.51',
    discountLabel: '-32%',
    searchTerms: ['scent of the black manor', 'offer highlights', 'horror']
  }),
  steamDeal({
    id: 'yakuza-kiwami-2',
    title: 'Yakuza Kiwami 2',
    appId: 3717340,
    vipPrice: '$12.74',
    salePrice: '$13.41',
    discountLabel: '-33%',
    searchTerms: ['yakuza kiwami 2', 'offer highlights', 'sega']
  }),
  steamDeal({
    id: 'once-upon-a-katamari',
    title: 'Once Upon A KATAMARI',
    appId: 1880620,
    vipPrice: '$19.48',
    salePrice: '$20.51',
    discountLabel: '-49%',
    searchTerms: ['once upon a katamari', 'offer highlights', 'bandai namco']
  }),
  steamDeal({
    id: 'age-of-empires-iv',
    title: 'Age of Empires IV: Anniversary Edition',
    appId: 1466860,
    vipPrice: '$15.19',
    salePrice: '$15.99',
    discountLabel: '-60%',
    searchTerms: ['age of empires iv', 'anniversary edition', 'offer highlights', 'strategy']
  }),
  steamDeal({
    id: 'styx-shards-of-darkness',
    title: 'Styx: Shards of Darkness',
    appId: 355790,
    vipPrice: '$1.62',
    salePrice: '$1.70',
    discountLabel: '-91%',
    searchTerms: ['styx', 'shards of darkness', 'offer highlights']
  }),
  steamDeal({
    id: 'ace-combat-7',
    title: 'Ace Combat 7: Skies Unknown',
    appId: 502500,
    vipPrice: '$7.92',
    salePrice: '$8.34',
    discountLabel: '-86%',
    searchTerms: ['ace combat 7', 'skies unknown', 'offer highlights']
  }),
  steamDeal({
    id: 'crusader-kings-3',
    title: 'Crusader Kings III',
    appId: 1158310,
    vipPrice: '$13.55',
    salePrice: '$14.26',
    discountLabel: '-71%',
    searchTerms: ['crusader kings iii', 'offer highlights', 'paradox']
  }),
  steamDeal({
    id: 'farming-simulator-25',
    title: 'Farming Simulator 25',
    appId: 2300320,
    vipPrice: '$18.04',
    salePrice: '$18.99',
    discountLabel: '-37%',
    searchTerms: ['farming simulator 25', 'offer highlights', 'simulation']
  })
]

export const PROMOTION_RECOMMENDED = [
  {
    id: 'rog-vip-picks',
    eyebrow: 'ROG VIP Picks',
    title: 'New deals that match high-impact single-player and strategy sessions.',
    description:
      'A hand-picked mix of sci-fi action, large-scale battles, and slower management sims to mirror the current Game Deals carousel.',
    image: pragmataHeroImage,
    searchTerms: ['vip picks', 'recommended', 'pragmata', 'strategy']
  },
  {
    id: 'open-world-spotlight',
    eyebrow: 'Spotlight',
    title: "Assassin's Creed Shadows remains one of the strongest premium-value offers in this rotation.",
    description:
      'The simulation keeps the same deal-first presentation with a stronger callout for cinematic open-world campaigns and discounted marquee releases.',
    image: assassinsCreedShadowsImage,
    searchTerms: ['assassins creed', 'shadows', 'spotlight', 'open world']
  },
  {
    id: 'strategy-stack',
    eyebrow: 'Strategy Stack',
    title: 'Total War and Master of Command anchor the slower, longer-session recommendation lane.',
    description:
      'These recommendations are positioned for players who usually spend more time in campaign loops, optimization, and layered battlefield planning.',
    image: totalWarWarhammerImage,
    searchTerms: ['warhammer', 'master of command', 'strategy stack', 'campaign']
  }
]

export const PROMOTION_NEWS = [
  {
    id: 'rog-pocket-gear',
    title: 'ROG Blind Box: Pocket Gear',
    summary:
      'Original Promotion / Purchase Period: April 1, 2026 - July 30, 2026 Claiming Period: Until August 30, 2026 on the official redemption page.',
    artworkKind: 'pocket-gear',
    layout: 'wide',
    badgeKind: 'external',
    badgeTone: 'gold',
    searchTerms: ['rog blind box', 'pocket gear', 'blind box', 'promotion', 'gear']
  },
  {
    id: 'zenbook-duo-ux8407aa',
    title: 'Zenbook Duo UX8407AA',
    summary: 'Zenbook Duo UX8407AA\nZenbook Duo UX8407AA',
    artworkKind: 'zenbook-duo',
    layout: 'wide',
    badgeKind: 'external',
    badgeTone: 'gold',
    searchTerms: ['zenbook duo', 'ux8407aa', 'asus laptop', 'copilot pc']
  },
  {
    id: 'pair-up-power-on',
    title: 'Get up to P1,000 savings...',
    summary: '',
    image: PROMOTION_NEWS_IMAGE_SOURCES['pair-up-power-on'],
    layout: 'standard',
    badgeKind: 'external',
    badgeTone: 'gold',
    searchTerms: ['p1000 savings', 'pair up power on', 'x870e', 'b850', 'asus motherboard']
  },
  {
    id: 'upgrade-what-matters',
    title: 'Get up to P6,000 voucher...',
    summary: '',
    image: PROMOTION_NEWS_IMAGE_SOURCES['upgrade-what-matters'],
    layout: 'standard',
    badgeKind: 'external',
    badgeTone: 'gold',
    searchTerms: ['p6000 voucher', 'upgrade what matters', 'asus upgrade', 'voucher']
  },
  {
    id: 'powered-by-asus',
    title: 'Powered By ASUS',
    summary: 'Powered by ASUS is a collaboration with select system builders that empowers users...',
    image: PROMOTION_NEWS_IMAGE_SOURCES['powered-by-asus'],
    layout: 'standard',
    badgeKind: 'external',
    badgeTone: 'gold',
    searchTerms: ['powered by asus', 'custom pcs', 'system builders']
  },
  {
    id: 'rog-facebook-page',
    title: 'ROG Facebook Page',
    summary: '',
    artworkKind: 'rog-facebook',
    layout: 'standard',
    badgeKind: 'facebook',
    badgeTone: 'blue',
    searchTerms: ['rog facebook page', 'facebook', 'community', 'philippines']
  },
  {
    id: 'chromagun-2-giveaway',
    title: 'Giving away ChromaGun 2: Dye Hard game keys!',
    summary: '',
    image: PROMOTION_NEWS_IMAGE_SOURCES['chromagun-2'],
    fallbackImage: chromaGun2Image,
    layout: 'standard',
    badgeKind: 'video',
    badgeTone: 'red',
    searchTerms: ['chromagun 2', 'giveaway', 'dye hard', 'game keys']
  },
  {
    id: 'wallpapers',
    title: 'Wallpapers',
    summary: 'Decorate your desktop with awesome ROG wallpapers!',
    artworkKind: 'wallpapers',
    layout: 'standard',
    badgeKind: 'image',
    badgeTone: 'gold',
    searchTerms: ['wallpapers', 'rog wallpapers', 'desktop']
  },
  {
    id: 'armoury-crate-forum',
    title: 'Armoury Crate',
    summary: 'ROG Forum - Armoury Crate',
    artworkKind: 'armoury-crate',
    layout: 'standard',
    badgeKind: 'forum',
    badgeTone: 'gold',
    searchTerms: ['armoury crate', 'rog forum', 'community']
  },
  {
    id: 'aura-creator-forum',
    title: 'AURA Creator',
    summary: 'ROG Forum - Aura Creator',
    artworkKind: 'aura-creator',
    layout: 'standard',
    badgeKind: 'forum',
    badgeTone: 'gold',
    searchTerms: ['aura creator', 'rog forum', 'lighting']
  },
  {
    id: 'asus-store',
    title: 'ASUS Store',
    summary: 'Discover the best products and solutions on the ASUS website.',
    artworkKind: 'asus-store',
    layout: 'standard',
    badgeKind: 'store',
    badgeTone: 'gold',
    searchTerms: ['asus store', 'shop', 'products']
  },
  {
    id: 'rog-discord',
    title: 'ROG Discord',
    summary: 'Join the official ROG Discord server',
    artworkKind: 'rog-discord',
    layout: 'standard',
    badgeKind: 'discord',
    badgeTone: 'violet',
    searchTerms: ['rog discord', 'discord', 'community', 'server']
  }
]

export const PROMOTION_FAQ = [
  {
    id: 'faq-vip',
    question: 'Who can access the ROG VIP prices?',
    answer:
      'The discounted VIP prices shown in the Promotion simulation are presented as member-only offers, matching the Armoury Crate upsell pattern shown in the reference layout.',
    searchTerms: ['vip', 'price', 'member', 'rog']
  },
  {
    id: 'faq-refresh',
    question: 'How often are the featured game deals refreshed?',
    answer:
      'This simulation keeps the weekly-refresh messaging from the original Armoury Crate layout. The hero banner and deal grid stay stable until the promotion data changes.',
    searchTerms: ['refresh', 'weekly', 'featured', 'deals']
  },
  {
    id: 'faq-search',
    question: 'What does the search field filter on this page?',
    answer:
      'Search filters the currently visible Promotion tab only. On Game Deals it filters the deal grid or FAQ list, while Recommended and News keep their own matching result sets.',
    searchTerms: ['search', 'filter', 'tab', 'results']
  },
  {
    id: 'faq-structure',
    question: 'Why is the Promotion page separate from Content Platform?',
    answer:
      'Promotion focuses on storefront-style deal discovery, while Content Platform remains the download library for wallpapers and curated content already present elsewhere in the simulation.',
    searchTerms: ['content platform', 'promotion', 'separate', 'storefront']
  }
]
