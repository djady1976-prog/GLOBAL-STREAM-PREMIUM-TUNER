/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RadioStation } from './types';

export const CURATED_STATIONS: RadioStation[] = [
  // ROMANIA
  {
    id: 'ro_kissfm',
    name: 'Kiss FM Romania',
    url: 'https://live.kissfm.ro/kissfm.mp3',
    country: 'Romania',
    language: 'Română',
    tags: ['Pop', 'Dance', 'Top 40', 'Hits'],
    bitrate: 128,
    format: 'MP3',
    votes: 4200,
    homepage: 'https://www.kissfm.ro'
  },
  {
    id: 'ro_rockfm',
    name: 'Rock FM Romania',
    url: 'https://live.rockfm.ro/rockfm.mp3',
    country: 'Romania',
    language: 'Română',
    tags: ['Rock', 'Classic Rock', 'Hard Rock'],
    bitrate: 128,
    format: 'MP3',
    votes: 3100,
    homepage: 'https://www.rockfm.ro'
  },
  {
    id: 'ro_radiozu',
    name: 'Radio ZU Romania',
    url: 'http://live.radiozu.ro:8020/radiozu',
    country: 'Romania',
    language: 'Română',
    tags: ['Pop', 'Hits', 'Talk', 'Entertainment'],
    bitrate: 128,
    format: 'MP3',
    votes: 5600,
    homepage: 'https://radiozu.ro'
  },
  {
    id: 'ro_digifm',
    name: 'Digi FM',
    url: 'https://edge126.rdsnet.ro/digifm/digifm.mp3',
    country: 'Romania',
    language: 'Română',
    tags: ['News', 'Pop', 'Soft Rock', 'Adult Contemporary'],
    bitrate: 128,
    format: 'MP3',
    votes: 2150,
    homepage: 'https://www.digifm.ro'
  },
  {
    id: 'ro_guerrilla',
    name: 'Radio Guerrilla',
    url: 'https://live.guerrillaradio.ro/guerrilla.aac',
    country: 'Romania',
    language: 'Română',
    tags: ['Alternative', 'Rock', 'Indie', 'Independent'],
    bitrate: 128,
    format: 'AAC',
    votes: 1890,
    homepage: 'https://www.guerrillaradio.ro'
  },
  {
    id: 'ro_cultural',
    name: 'Radio Romania Cultural',
    url: 'http://stream.radioromania.ro:8012/',
    country: 'Romania',
    language: 'Română',
    tags: ['Culture', 'Classical', 'Jazz', 'Educative'],
    bitrate: 128,
    format: 'MP3',
    votes: 950,
    homepage: 'https://www.radioromaniacultural.ro'
  },

  // ITALY
  {
    id: 'it_radioitalia',
    name: 'Radio Italia Solo Musica Italiana',
    url: 'https://icecast.unitedradio.it/RadioItalia',
    country: 'Italy',
    language: 'Italiano',
    tags: ['Pop', 'Italian Hits', 'Adult Contemporary'],
    bitrate: 128,
    format: 'MP3',
    votes: 4900,
    homepage: 'https://www.radioitalia.it'
  },
  {
    id: 'it_rai_1',
    name: 'Rai Radio 1',
    url: 'https://icestreaming.rai.it/1.mp3',
    country: 'Italy',
    language: 'Italiano',
    tags: ['News', 'Talk', 'Sports', 'National'],
    bitrate: 128,
    format: 'MP3',
    votes: 3500,
    homepage: 'https://www.raiplaysound.it'
  },
  {
    id: 'it_rai_2',
    name: 'Rai Radio 2',
    url: 'https://icestreaming.rai.it/2.mp3',
    country: 'Italy',
    language: 'Italiano',
    tags: ['Pop', 'Adult Hits', 'Comedy', 'Interactive'],
    bitrate: 128,
    format: 'MP3',
    votes: 2800,
    homepage: 'https://www.raiplaysound.it'
  },
  {
    id: 'it_rai_3',
    name: 'Rai Radio 3',
    url: 'https://icestreaming.rai.it/3.mp3',
    country: 'Italy',
    language: 'Italiano',
    tags: ['Classical', 'Culture', 'Literature', 'Theatre'],
    bitrate: 128,
    format: 'MP3',
    votes: 1950,
    homepage: 'https://www.raiplaysound.it'
  },

  // INTERNATIONAL / CHILL & LOUNGE / JAZZ
  {
    id: 'int_cafedelmar',
    name: 'Café del Mar Marina',
    url: 'https://cafe-del-mar.ice.infomaniak.ch/cafe-del-mar-192.mp3',
    country: 'Spain',
    language: 'English',
    tags: ['Chillout', 'Lounge', 'Ambient', 'Ibiza'],
    bitrate: 192,
    format: 'MP3',
    votes: 6800,
    homepage: 'https://cafedelmar.com'
  },
  {
    id: 'int_groovesalad',
    name: 'SomaFM Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    country: 'USA',
    language: 'English',
    tags: ['Chillout', 'Downtempo', 'Ambient', 'Electronic'],
    bitrate: 128,
    format: 'MP3',
    votes: 9800,
    homepage: 'https://somafm.com'
  },
  {
    id: 'int_dronezone',
    name: 'SomaFM Drone Zone',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    country: 'USA',
    language: 'English',
    tags: ['Ambient', 'Drone', 'Minimal', 'Atmospheric'],
    bitrate: 128,
    format: 'MP3',
    votes: 5400,
    homepage: 'https://somafm.com'
  },
  {
    id: 'int_swissjazz',
    name: 'Radio Swiss Jazz',
    url: 'https://stream.srg-ssr.ch/m/rsj/mp3_128',
    country: 'Switzerland',
    language: 'Multilingual',
    tags: ['Jazz', 'Swing', 'Cool Jazz', 'Soul'],
    bitrate: 128,
    format: 'MP3',
    votes: 4300,
    homepage: 'https://www.radioswissjazz.ch'
  },
  {
    id: 'int_swissclassic',
    name: 'Radio Swiss Classic',
    url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    country: 'Switzerland',
    language: 'Classical',
    tags: ['Classical', 'Symphonic', 'Baroque', 'Opus'],
    bitrate: 128,
    format: 'MP3',
    votes: 3820,
    homepage: 'https://www.radioswissclassic.ch'
  },
  {
    id: 'int_smoothjazz',
    name: 'Smooth Jazz Global Classic',
    url: 'https://smoothjazz.com/streams/smoothjazz_128.mp3',
    country: 'USA',
    language: 'English',
    tags: ['Smooth Jazz', 'Contemporary Jazz', 'Chill'],
    bitrate: 128,
    format: 'MP3',
    votes: 3910,
    homepage: 'https://smoothjazz.com'
  },
  {
    id: 'int_defjay',
    name: 'Defjay Radio R&B',
    url: 'https://defjay.de/defjay.mp3',
    country: 'Germany',
    language: 'German',
    tags: ['R&B', 'Hip Hop', 'Urban', 'Soul'],
    bitrate: 128,
    format: 'MP3',
    votes: 2100,
    homepage: 'https://www.defjay.de'
  },

  // FRANCE
  {
    id: 'fr_franceinter',
    name: 'France Inter',
    url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
    country: 'France',
    language: 'Français',
    tags: ['News', 'Talk', 'Culture', 'Debate'],
    bitrate: 128,
    format: 'MP3',
    votes: 8800,
    homepage: 'https://www.radiofrance.fr/franceinter'
  },
  {
    id: 'fr_fipparis',
    name: 'FIP Radio Paris',
    url: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
    country: 'France',
    language: 'Français',
    tags: ['Eclectic', 'Jazz', 'Chillout', 'World'],
    bitrate: 128,
    format: 'MP3',
    votes: 11200,
    homepage: 'https://www.radiofrance.fr/fip'
  },
  {
    id: 'fr_radionova',
    name: 'Radio Nova Paris',
    url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3',
    country: 'France',
    language: 'Français',
    tags: ['Indie', 'Alternative', 'World', 'Groove'],
    bitrate: 128,
    format: 'MP3',
    votes: 6200,
    homepage: 'https://www.nova.fr'
  },
  {
    id: 'fr_nrj',
    name: 'NRJ France',
    url: 'https://cdn.nrjaudio.fm/adwz3t1v/nrj/1_mp3.mp3',
    country: 'France',
    language: 'Français',
    tags: ['Pop', 'Hits', 'Dance', 'Top 40'],
    bitrate: 128,
    format: 'MP3',
    votes: 7500,
    homepage: 'https://www.nrj.fr'
  },

  // UNITED KINGDOM
  {
    id: 'uk_capital',
    name: 'Capital FM United Kingdom',
    url: 'https://icecast.capitalfm.com/CapitalUKMP3',
    country: 'United Kingdom',
    language: 'English',
    tags: ['Pop', 'Hits', 'Top 40', 'Electronic'],
    bitrate: 128,
    format: 'MP3',
    votes: 9100,
    homepage: 'https://www.capitalfm.com'
  },
  {
    id: 'uk_classicfm',
    name: 'Classic FM UK',
    url: 'https://icecast.classicfm.com/ClassicFMMP3',
    country: 'United Kingdom',
    language: 'English',
    tags: ['Classical', 'Symphonic', 'Chillout', 'Opera'],
    bitrate: 128,
    format: 'MP3',
    votes: 5800,
    homepage: 'https://www.classicfm.com'
  },
  {
    id: 'uk_planetrock',
    name: 'Planet Rock UK',
    url: 'https://planetrock.ice.infomaniak.ch/planetrock-128.mp3',
    country: 'United Kingdom',
    language: 'English',
    tags: ['Classic Rock', 'Hard Rock', 'Metal'],
    bitrate: 128,
    format: 'MP3',
    votes: 4200,
    homepage: 'https://www.planetrock.com'
  },

  // CANADA
  {
    id: 'ca_cbcmusic',
    name: 'CBC Music Toronto',
    url: 'https://live-radio.cbc.ca/cbc-music-toronto.mp3',
    country: 'Canada',
    language: 'English',
    tags: ['Jazz', 'Classical', 'Indie', 'Eclectic'],
    bitrate: 128,
    format: 'MP3',
    votes: 5300,
    homepage: 'https://www.cbc.ca/music'
  },

  // NETHERLANDS
  {
    id: 'nl_radio538',
    name: 'Radio 538 Holland',
    url: 'https://stream.radio538.nl/radio538/mp3',
    country: 'Netherlands',
    language: 'Nederlands',
    tags: ['Pop', 'Top 40', 'Dance', 'Hits'],
    bitrate: 128,
    format: 'MP3',
    votes: 6800,
    homepage: 'https://www.538.nl'
  },
  {
    id: 'nl_sublime',
    name: 'Sublime FM NL',
    url: 'https://stream.sublime.nl/sublime/mp3',
    country: 'Netherlands',
    language: 'Nederlands',
    tags: ['Funk', 'Soul', 'Jazz', 'Groove'],
    bitrate: 128,
    format: 'MP3',
    votes: 3905,
    homepage: 'https://sublime.nl'
  },

  // JAPAN
  {
    id: 'jp_jpop',
    name: 'J-Pop Powerplay',
    url: 'https://kathy.torontocast.com:3060/mp3',
    country: 'Japan',
    language: 'Japanese',
    tags: ['J-Pop', 'Hits', 'Japanese', 'Anime'],
    bitrate: 128,
    format: 'MP3',
    votes: 5120,
    homepage: 'http://japanimradio.com'
  },

  // BRAZIL
  {
    id: 'br_bossanova',
    name: 'Bossa Nova Brazil',
    url: 'https://bossanovabrazil.ice.infomaniak.ch/bossanovabrazil-128.mp3',
    country: 'Brazil',
    language: 'Português',
    tags: ['Bossa Nova', 'Samba', 'Jazz', 'Acoustic'],
    bitrate: 128,
    format: 'MP3',
    votes: 6100,
    homepage: 'https://bossanovabrazil.com'
  },

  // GREECE
  {
    id: 'gr_zooradio',
    name: 'Zoo Radio 90.8',
    url: 'https://zooradio.live24.gr/zoo908',
    country: 'Greece',
    language: 'Ελληνικά',
    tags: ['Pop', 'Hits', 'Top 40', 'Dance'],
    bitrate: 128,
    format: 'MP3',
    votes: 3200,
    homepage: 'https://www.zooradio.gr'
  },

  // AUSTRIA
  {
    id: 'at_oe3',
    name: 'Hitradio Ö3',
    url: 'https://orf-live.ors-shoutcast.at/oe3-q2a',
    country: 'Austria',
    language: 'Deutsch',
    tags: ['Pop', 'Hits', 'Top 40', 'News'],
    bitrate: 192,
    format: 'MP3',
    votes: 4300,
    homepage: 'https://oe3.orf.at'
  },

  // PORTUGAL
  {
    id: 'pt_rfm',
    name: 'RFM Portugal',
    url: 'https://stream-icarus.rfm.pt/rfm',
    country: 'Portugal',
    language: 'Português',
    tags: ['Pop', 'Hits', 'Dance', 'Top 40'],
    bitrate: 128,
    format: 'MP3',
    votes: 2900,
    homepage: 'https://rfm.sapo.pt'
  },

  // MOLDOVA
  {
    id: 'md_chisinau',
    name: 'Radio Chișinău',
    url: 'https://stream.radiochisinau.md:8443/radiochisinau',
    country: 'Moldova',
    language: 'Română',
    tags: ['News', 'Pop', 'Talk', 'Culture'],
    bitrate: 128,
    format: 'MP3',
    votes: 3800,
    homepage: 'https://radiochisinau.md'
  },

  // HUNGARY
  {
    id: 'hu_bartok',
    name: 'MR3 Bartók Rádió',
    url: 'https://stream.creacast.com/mr3-bartok',
    country: 'Hungary',
    language: 'Magyar',
    tags: ['Classical', 'Opera', 'Jazz', 'Culture'],
    bitrate: 192,
    format: 'MP3',
    votes: 2150,
    homepage: 'https://mediaklikk.hu/bartok'
  },

  // BULGARIA
  {
    id: 'bg_hristo',
    name: 'BNR Hristo Botev',
    url: 'http://stream.bnr.bg:8000/hristobotev.mp3',
    country: 'Bulgaria',
    language: 'Български',
    tags: ['Culture', 'Talk', 'Classical', 'Jazz'],
    bitrate: 128,
    format: 'MP3',
    votes: 1840,
    homepage: 'https://bnr.bg/hristobotev'
  },

  // POLAND
  {
    id: 'pl_radiozet',
    name: 'Radio Zet Poland',
    url: 'https://r.radiozet.pl/ZET.mp3',
    country: 'Poland',
    language: 'Polski',
    tags: ['Pop', 'Hits', 'News', 'Top 40'],
    bitrate: 128,
    format: 'MP3',
    votes: 4900,
    homepage: 'https://www.radiozet.pl'
  },

  // BELGIUM
  {
    id: 'be_stubru',
    name: 'Studio Brussel',
    url: 'https://icecast.vrtcdn.be/stubru-high.mp3',
    country: 'Belgium',
    language: 'Nederlands',
    tags: ['Alternative', 'Rock', 'Indie', 'Electro'],
    bitrate: 128,
    format: 'MP3',
    votes: 5600,
    homepage: 'https://www.stubru.be'
  },

  // TURKEY
  {
    id: 'tr_trtfm',
    name: 'TRT FM',
    url: 'https://radyo.trt.net.tr/trt-fm.mp3',
    country: 'Turkey',
    language: 'Türkçe',
    tags: ['Pop', 'Talk', 'News', 'Turkish Music'],
    bitrate: 128,
    format: 'MP3',
    votes: 6220,
    homepage: 'https://www.trt.net.tr'
  },

  // SWEDEN
  {
    id: 'se_srp3',
    name: 'Sveriges Radio P3',
    url: 'https://http-live.sr.se/p3-mp3-192',
    country: 'Sweden',
    language: 'Svenska',
    tags: ['Alternative', 'Indie', 'Pop', 'Talk'],
    bitrate: 192,
    format: 'MP3',
    votes: 3820,
    homepage: 'https://sverigesradio.se/p3'
  },

  // NORWAY
  {
    id: 'no_nrkp3',
    name: 'NRK P3 Norway',
    url: 'https://lyd.nrk.no/nrk_radio_p3_mp3_h',
    country: 'Norway',
    language: 'Norsk',
    tags: ['Hits', 'Alternative', 'Hip Hop', 'Youth'],
    bitrate: 192,
    format: 'MP3',
    votes: 4110,
    homepage: 'https://p3.no'
  },

  // AUSTRALIA
  {
    id: 'au_triplej',
    name: 'ABC Triple J',
    url: 'https://http-live.abc.net.au/triplej-mp3-128',
    country: 'Australia',
    language: 'English',
    tags: ['Alternative', 'Rock', 'Indie', 'Live Music'],
    bitrate: 128,
    format: 'MP3',
    votes: 7200,
    homepage: 'https://abc.net.au/triplej'
  }
];
