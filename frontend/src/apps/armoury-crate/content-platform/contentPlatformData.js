import animeMechaPulseImage from '../../../assets/armoury-crate/content-platform/anime-mecha-pulse.svg'
import animeSakuraCircuitImage from '../../../assets/armoury-crate/content-platform/anime-sakura-circuit.svg'
import codeVeinIiImage from '../../../assets/armoury-crate/content-platform/cover-code-vein-2.svg'
import chromaGun2Image from '../../../assets/armoury-crate/content-platform/cover-chromagun-2.svg'
import romeoDeadManV01Image from '../../../assets/armoury-crate/content-platform/cover-romeo-dead-man-v01.svg'
import romeoDeadManV02Image from '../../../assets/armoury-crate/content-platform/cover-romeo-dead-man-v02.svg'
import heroWallpaperEvolutionImage from '../../../assets/armoury-crate/content-platform/hero-wallpaper-evolution.svg'
import wallpaper8BitCityImage from '../../../assets/armoury-crate/content-platform/wallpaper-8bit-city.svg'
import wallpaperGameskeletonImage from '../../../assets/armoury-crate/content-platform/wallpaper-gameskeleton.svg'
import wallpaperZephyrusDuoZormImage from '../../../assets/armoury-crate/content-platform/wallpaper-zephyrus-duo-zorm.svg'
import wallpaperZephyrusSImage from '../../../assets/armoury-crate/content-platform/wallpaper-zephyrus-s.svg'

export const CONTENT_PLATFORM_STORAGE_KEY = 'jezos_armoury_content_platform_state'

const CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES = {
  'chromagun-2': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/Xb0QKIDo7dCdSBzGTlwJMk8yjB6olpt4bDe83ouI.png',
  'code-vein-ii': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/QWhq38xd3tJSX5qedpgxkmRGk89dMNAfRb5q3lcw.png',
  'romeo-dead-man-v01': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/Oll6J0aHzkiKS9xSFlgddSSMs4QMuQCz9VJ0wA6l.png',
  'romeo-dead-man-v02': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/9anv4msuP74AZ2Qg8KveOJSFGje3YVjwbC6cQ0zM.png',
  'crisol-theater-of-idols': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/RxH5vxARYjwyuKTdtkaORfwUugK8AMZPM02P9fiE.png',
  'nrg-rog-visual-1': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/fyCkz5UusLgbq7frNUm5eSm8eGQ2rPTscr0vd3TK.png',
  'vampire-bloodlines-2': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/7rFCNBCWhyc8WQU84r2qNoXZE3TMPEGWSTr8tO3x.png',
  'silent-hill-f': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/AxUTbkCxr0pIs1yOMtCc78KEXk8dRrMfwQMX3NSS.png',
  gameskeleton: 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/IjeRfozoh5zzDcDATAklKvTcZZtTJadWEc3oZ652.jpg',
  'zephyrus-duo-zorm': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/8Z4I1jI4iQkxCcAnkadMM5EJ7DHmRvMQ5GlQGNnq.jpg',
  'zephyrus-s': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/8Z4I1jI4iQkxCcAnkadMM5EJ7DHmRvMQ5GlQGNnq.jpg',
  '8-bit-city': 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/dqlNtdU1TWphBJIfMrNAPn9SyuLqYwCPOcsu9AEi.jpg'
}

export const CONTENT_PLATFORM_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'anime-vision', label: 'AniMe Vision' },
  { id: 'aura-wallpaper', label: 'Aura Wallpaper' },
  { id: 'static-wallpaper', label: 'Static Wallpaper' }
]

export const CONTENT_PLATFORM_SORT_OPTIONS = [
  { id: 'newest', label: 'Update: Newest to Oldest' },
  { id: 'oldest', label: 'Update: Oldest to Newest' },
  { id: 'az', label: 'Update: A to Z' }
]

export const CONTENT_PLATFORM_FILTER_OPTIONS = [
  { id: 'all', label: 'All Content' },
  { id: 'game', label: 'Games' },
  { id: 'wallpaper', label: 'Wallpapers' },
  { id: 'anime', label: 'AniMe Vision' }
]

export const CONTENT_PLATFORM_HEROES = {
  home: [
    {
      id: 'wallpaper-evolution',
      videoUrl: 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/RujNcI492nzaJqK06M7zqXLiuOz9BDGSTkHLWNUt.mp4',
      title: 'Aura Wallpaper Evolution: The Dual Enjoyment of Interactive and Game Collaboration Wallpapers!',
      description:
        'Explore our interactive wallpapers and bring your desktop to life. Also, do not miss our exclusive collaborative gaming wallpaper series to fully immerse yourself in the world of gaming!',
      image: heroWallpaperEvolutionImage
    },
    {
      id: 'anime-vision-gallery',
      videoUrl: 'https://dlcdn-rogboxbu5.asus.com/pub/ASUS/APService/Gaming/SYS/ROGS/ContentPlatform/IQ25lvGHVRXYRFsiiy0wrUIx9BGM0mp4rU21sgag.mp4',
      title: 'AniMe Vision effects are now available!',
      description: 'Download now and shine in & out of the game!',
      image: animeMechaPulseImage
    }
  ]
}

export const CONTENT_PLATFORM_ITEMS_BY_ID = {
  'chromagun-2': {
    id: 'chromagun-2',
    title: 'ChromaGun 2: Dye Hard',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['chromagun-2'],
    fallbackImage: chromaGun2Image,
    badgeText: 'Free',
    type: 'game',
    tags: ['chromagun', 'dye hard', 'puzzle', 'new release'],
    sortDate: '2026-04-11T12:00:00.000Z'
  },
  'code-vein-ii': {
    id: 'code-vein-ii',
    title: 'CODE VEIN II',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['code-vein-ii'],
    fallbackImage: codeVeinIiImage,
    badgeText: 'Free',
    type: 'game',
    tags: ['code vein', 'bandai namco', 'action rpg', 'new release'],
    sortDate: '2026-04-10T12:00:00.000Z'
  },
  'romeo-dead-man-v01': {
    id: 'romeo-dead-man-v01',
    title: 'ROMEO IS A DEAD MAN (Version 1)',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['romeo-dead-man-v01'],
    fallbackImage: romeoDeadManV01Image,
    badgeText: 'Free',
    type: 'game',
    tags: ['romeo is a dead man', 'action', 'new release'],
    sortDate: '2026-04-09T12:00:00.000Z'
  },
  'romeo-dead-man-v02': {
    id: 'romeo-dead-man-v02',
    title: 'ROMEO IS A DEAD MAN (Version 2)',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['romeo-dead-man-v02'],
    fallbackImage: romeoDeadManV02Image,
    badgeText: 'Free',
    type: 'game',
    tags: ['romeo is a dead man', 'robot', 'new release'],
    sortDate: '2026-04-08T12:00:00.000Z'
  },
  'crisol-theater-of-idols': {
    id: 'crisol-theater-of-idols',
    title: 'Crisol: Theater of Idols',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['crisol-theater-of-idols'],
    fallbackImage: romeoDeadManV01Image,
    badgeText: 'Free',
    type: 'game',
    tags: ['crisol', 'theater of idols', 'rog recommendation'],
    sortDate: '2026-04-03T12:00:00.000Z'
  },
  'nrg-rog-visual-1': {
    id: 'nrg-rog-visual-1',
    title: 'NRG x ROG Visual 1',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['nrg-rog-visual-1'],
    fallbackImage: wallpaperZephyrusDuoZormImage,
    badgeText: 'Free',
    type: 'wallpaper',
    tags: ['nrg', 'rog', 'visual', 'recommendation'],
    sortDate: '2026-04-02T12:00:00.000Z'
  },
  'vampire-bloodlines-2': {
    id: 'vampire-bloodlines-2',
    title: 'Vampire: The Masquerade - Bloodlines 2',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['vampire-bloodlines-2'],
    fallbackImage: codeVeinIiImage,
    badgeText: 'Free',
    type: 'game',
    tags: ['vampire the masquerade', 'bloodlines 2', 'rog recommendation'],
    sortDate: '2026-04-01T12:00:00.000Z'
  },
  'silent-hill-f': {
    id: 'silent-hill-f',
    title: 'Silent Hill f',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['silent-hill-f'],
    fallbackImage: romeoDeadManV02Image,
    badgeText: 'Free',
    type: 'game',
    tags: ['silent hill f', 'rog recommendation'],
    sortDate: '2026-03-31T12:00:00.000Z'
  },
  '8-bit-city': {
    id: '8-bit-city',
    title: '8-bit City',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['8-bit-city'],
    fallbackImage: wallpaper8BitCityImage,
    badgeText: 'Free',
    type: 'wallpaper',
    tags: ['city', 'rog', 'wallpaper', 'neon'],
    sortDate: '2026-04-07T12:00:00.000Z'
  },
  gameskeleton: {
    id: 'gameskeleton',
    title: 'Gameskeleton',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES.gameskeleton,
    fallbackImage: wallpaperGameskeletonImage,
    badgeText: 'Free',
    type: 'wallpaper',
    tags: ['blueprint', 'wallpaper', 'skeleton'],
    sortDate: '2026-04-06T12:00:00.000Z'
  },
  'zephyrus-duo-zorm': {
    id: 'zephyrus-duo-zorm',
    title: 'Zephyrus Duo 15 x ZORM',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['zephyrus-duo-zorm'],
    fallbackImage: wallpaperZephyrusDuoZormImage,
    badgeText: 'Free',
    type: 'wallpaper',
    tags: ['zephyrus duo', 'collaboration', 'wallpaper'],
    sortDate: '2026-04-05T12:00:00.000Z'
  },
  'zephyrus-s': {
    id: 'zephyrus-s',
    title: 'Zephyrus S',
    image: CONTENT_PLATFORM_REMOTE_IMAGE_SOURCES['zephyrus-s'],
    fallbackImage: wallpaperZephyrusSImage,
    badgeText: 'Free',
    type: 'wallpaper',
    tags: ['zephyrus', 'rog', 'wallpaper'],
    sortDate: '2026-04-04T12:00:00.000Z'
  },
  'mecha-pulse': {
    id: 'mecha-pulse',
    title: 'Mecha Pulse',
    image: animeMechaPulseImage,
    badgeText: 'Free',
    type: 'anime',
    tags: ['anime vision', 'mecha', 'led animation'],
    sortDate: '2026-04-03T12:00:00.000Z'
  },
  'sakura-circuit': {
    id: 'sakura-circuit',
    title: 'Sakura Circuit',
    image: animeSakuraCircuitImage,
    badgeText: 'Free',
    type: 'anime',
    tags: ['anime vision', 'sakura', 'neon'],
    sortDate: '2026-04-02T12:00:00.000Z'
  },
  'rog-pulse-runner': {
    id: 'rog-pulse-runner',
    title: 'ROG Pulse Runner',
    image: wallpaperZephyrusDuoZormImage,
    badgeText: 'Free',
    type: 'anime',
    tags: ['anime vision', 'rog', 'runner'],
    sortDate: '2026-04-01T12:00:00.000Z'
  },
  'nebula-grid': {
    id: 'nebula-grid',
    title: 'Nebula Grid',
    image: wallpaperGameskeletonImage,
    badgeText: 'Free',
    type: 'anime',
    tags: ['anime vision', 'grid', 'matrix'],
    sortDate: '2026-03-31T12:00:00.000Z'
  }
}

export const CONTENT_PLATFORM_SECTIONS = {
  home: [
    {
      id: 'featured',
      title: 'Featured',
      itemIds: ['8-bit-city', 'gameskeleton', 'zephyrus-duo-zorm', 'zephyrus-s']
    },
    {
      id: 'new-releases',
      title: 'New Releases',
      itemIds: ['chromagun-2', 'code-vein-ii', 'romeo-dead-man-v01', 'romeo-dead-man-v02']
    },
    {
      id: 'rog-recommendations',
      title: 'ROG Recommendations',
      itemIds: ['crisol-theater-of-idols', 'nrg-rog-visual-1', 'vampire-bloodlines-2', 'silent-hill-f']
    }
  ],
  'anime-vision': [
    {
      id: 'anime-vision-featured',
      title: 'AniMe Vision Featured',
      itemIds: ['mecha-pulse', 'sakura-circuit', 'rog-pulse-runner', 'nebula-grid']
    },
    {
      id: 'anime-vision-recommendations',
      title: 'ROG Recommendations',
      itemIds: ['rog-pulse-runner', 'mecha-pulse', 'nebula-grid', 'sakura-circuit']
    }
  ],
  'aura-wallpaper': [
    {
      id: 'aura-wallpaper-featured',
      title: 'Featured',
      itemIds: ['8-bit-city', 'gameskeleton', 'zephyrus-duo-zorm', 'zephyrus-s']
    },
    {
      id: 'aura-wallpaper-recommendations',
      title: 'ROG Recommendations',
      itemIds: ['zephyrus-duo-zorm', '8-bit-city', 'zephyrus-s', 'gameskeleton']
    }
  ],
  'static-wallpaper': [
    {
      id: 'static-wallpaper-featured',
      title: 'Featured',
      itemIds: ['zephyrus-s', '8-bit-city', 'gameskeleton', 'zephyrus-duo-zorm']
    },
    {
      id: 'static-wallpaper-classics',
      title: 'ROG Recommendations',
      itemIds: ['gameskeleton', 'zephyrus-s', '8-bit-city', 'zephyrus-duo-zorm']
    }
  ]
}
