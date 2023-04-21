import { EmoteId, WearableId } from '../../types'

const BASE_WEARABLES: WearableId[] = [
  'urn:decentraland:off-chain:base-avatars:BaseFemale',
  'urn:decentraland:off-chain:base-avatars:BaseMale',
  'urn:decentraland:off-chain:base-avatars:blue_star_earring',
  'urn:decentraland:off-chain:base-avatars:green_feather_earring',
  'urn:decentraland:off-chain:base-avatars:square_earring',
  'urn:decentraland:off-chain:base-avatars:pink_gem_earring',
  'urn:decentraland:off-chain:base-avatars:f_skull_earring',
  'urn:decentraland:off-chain:base-avatars:thunder_02_earring',
  'urn:decentraland:off-chain:base-avatars:punk_piercing',
  'urn:decentraland:off-chain:base-avatars:golden_earring',
  'urn:decentraland:off-chain:base-avatars:Thunder_earring',
  'urn:decentraland:off-chain:base-avatars:toruspiercing',
  'urn:decentraland:off-chain:base-avatars:triple_ring',
  'urn:decentraland:off-chain:base-avatars:pearls_earring',
  'urn:decentraland:off-chain:base-avatars:f_eyebrows_00',
  'urn:decentraland:off-chain:base-avatars:f_eyebrows_01',
  'urn:decentraland:off-chain:base-avatars:f_eyebrows_02',
  'urn:decentraland:off-chain:base-avatars:f_eyebrows_03',
  'urn:decentraland:off-chain:base-avatars:f_eyebrows_04',
  'urn:decentraland:off-chain:base-avatars:f_eyebrows_05',
  'urn:decentraland:off-chain:base-avatars:f_eyebrows_06',
  'urn:decentraland:off-chain:base-avatars:f_eyebrows_07',
  'urn:decentraland:off-chain:base-avatars:eyebrows_00',
  'urn:decentraland:off-chain:base-avatars:eyebrows_01',
  'urn:decentraland:off-chain:base-avatars:eyebrows_02',
  'urn:decentraland:off-chain:base-avatars:eyebrows_03',
  'urn:decentraland:off-chain:base-avatars:eyebrows_04',
  'urn:decentraland:off-chain:base-avatars:eyebrows_05',
  'urn:decentraland:off-chain:base-avatars:eyebrows_06',
  'urn:decentraland:off-chain:base-avatars:eyebrows_07',
  'urn:decentraland:off-chain:base-avatars:f_eyes_00',
  'urn:decentraland:off-chain:base-avatars:f_eyes_01',
  'urn:decentraland:off-chain:base-avatars:f_eyes_02',
  'urn:decentraland:off-chain:base-avatars:f_eyes_03',
  'urn:decentraland:off-chain:base-avatars:f_eyes_04',
  'urn:decentraland:off-chain:base-avatars:f_eyes_05',
  'urn:decentraland:off-chain:base-avatars:f_eyes_06',
  'urn:decentraland:off-chain:base-avatars:f_eyes_07',
  'urn:decentraland:off-chain:base-avatars:f_eyes_08',
  'urn:decentraland:off-chain:base-avatars:f_eyes_09',
  'urn:decentraland:off-chain:base-avatars:f_eyes_10',
  'urn:decentraland:off-chain:base-avatars:f_eyes_11',
  'urn:decentraland:off-chain:base-avatars:eyes_00',
  'urn:decentraland:off-chain:base-avatars:eyes_01',
  'urn:decentraland:off-chain:base-avatars:eyes_02',
  'urn:decentraland:off-chain:base-avatars:eyes_03',
  'urn:decentraland:off-chain:base-avatars:eyes_04',
  'urn:decentraland:off-chain:base-avatars:eyes_05',
  'urn:decentraland:off-chain:base-avatars:eyes_06',
  'urn:decentraland:off-chain:base-avatars:eyes_07',
  'urn:decentraland:off-chain:base-avatars:eyes_08',
  'urn:decentraland:off-chain:base-avatars:eyes_09',
  'urn:decentraland:off-chain:base-avatars:eyes_10',
  'urn:decentraland:off-chain:base-avatars:eyes_11',
  'urn:decentraland:off-chain:base-avatars:black_sun_glasses',
  'urn:decentraland:off-chain:base-avatars:cyclope',
  'urn:decentraland:off-chain:base-avatars:f_glasses_cat_style',
  'urn:decentraland:off-chain:base-avatars:f_glasses_city',
  'urn:decentraland:off-chain:base-avatars:f_glasses_fashion',
  'urn:decentraland:off-chain:base-avatars:f_glasses',
  'urn:decentraland:off-chain:base-avatars:heart_glasses',
  'urn:decentraland:off-chain:base-avatars:italian_director',
  'urn:decentraland:off-chain:base-avatars:aviatorstyle',
  'urn:decentraland:off-chain:base-avatars:matrix_sunglasses',
  'urn:decentraland:off-chain:base-avatars:piratepatch',
  'urn:decentraland:off-chain:base-avatars:retro_sunglasses',
  'urn:decentraland:off-chain:base-avatars:rounded_sun_glasses',
  'urn:decentraland:off-chain:base-avatars:thug_life',
  'urn:decentraland:off-chain:base-avatars:balbo_beard',
  'urn:decentraland:off-chain:base-avatars:lincoln_beard',
  'urn:decentraland:off-chain:base-avatars:beard',
  'urn:decentraland:off-chain:base-avatars:chin_beard',
  'urn:decentraland:off-chain:base-avatars:french_beard',
  'urn:decentraland:off-chain:base-avatars:full_beard',
  'urn:decentraland:off-chain:base-avatars:goatee_beard',
  'urn:decentraland:off-chain:base-avatars:granpa_beard',
  'urn:decentraland:off-chain:base-avatars:horseshoe_beard',
  'urn:decentraland:off-chain:base-avatars:handlebar',
  'urn:decentraland:off-chain:base-avatars:Mustache_Short_Beard',
  'urn:decentraland:off-chain:base-avatars:short_boxed_beard',
  'urn:decentraland:off-chain:base-avatars:old_mustache_beard',
  'urn:decentraland:off-chain:base-avatars:bear_slippers',
  'urn:decentraland:off-chain:base-avatars:citycomfortableshoes',
  'urn:decentraland:off-chain:base-avatars:classic_shoes',
  'urn:decentraland:off-chain:base-avatars:crocs',
  'urn:decentraland:off-chain:base-avatars:crocsocks',
  'urn:decentraland:off-chain:base-avatars:Espadrilles',
  'urn:decentraland:off-chain:base-avatars:bun_shoes',
  'urn:decentraland:off-chain:base-avatars:comfy_green_sandals',
  'urn:decentraland:off-chain:base-avatars:pink_sleepers',
  'urn:decentraland:off-chain:base-avatars:ruby_blue_loafer',
  'urn:decentraland:off-chain:base-avatars:ruby_red_loafer',
  'urn:decentraland:off-chain:base-avatars:SchoolShoes',
  'urn:decentraland:off-chain:base-avatars:sport_black_shoes',
  'urn:decentraland:off-chain:base-avatars:sport_colored_shoes',
  'urn:decentraland:off-chain:base-avatars:pink_blue_socks',
  'urn:decentraland:off-chain:base-avatars:red_sandals',
  'urn:decentraland:off-chain:base-avatars:comfy_sport_sandals',
  'urn:decentraland:off-chain:base-avatars:m_greenflipflops',
  'urn:decentraland:off-chain:base-avatars:m_mountainshoes.glb',
  'urn:decentraland:off-chain:base-avatars:m_feet_soccershoes',
  'urn:decentraland:off-chain:base-avatars:moccasin',
  'urn:decentraland:off-chain:base-avatars:f_m_sandals',
  'urn:decentraland:off-chain:base-avatars:sneakers',
  'urn:decentraland:off-chain:base-avatars:sport_blue_shoes',
  'urn:decentraland:off-chain:base-avatars:hair_anime_01',
  'urn:decentraland:off-chain:base-avatars:hair_undere',
  'urn:decentraland:off-chain:base-avatars:hair_bun',
  'urn:decentraland:off-chain:base-avatars:hair_coolshortstyle',
  'urn:decentraland:off-chain:base-avatars:cornrows',
  'urn:decentraland:off-chain:base-avatars:double_bun',
  'urn:decentraland:off-chain:base-avatars:modern_hair',
  'urn:decentraland:off-chain:base-avatars:hair_f_oldie',
  'urn:decentraland:off-chain:base-avatars:hair_f_oldie_02',
  'urn:decentraland:off-chain:base-avatars:pompous',
  'urn:decentraland:off-chain:base-avatars:pony_tail',
  'urn:decentraland:off-chain:base-avatars:hair_punk',
  'urn:decentraland:off-chain:base-avatars:shoulder_bob_hair',
  'urn:decentraland:off-chain:base-avatars:curly_hair',
  'urn:decentraland:off-chain:base-avatars:shoulder_hair',
  'urn:decentraland:off-chain:base-avatars:standard_hair',
  'urn:decentraland:off-chain:base-avatars:hair_stylish_hair',
  'urn:decentraland:off-chain:base-avatars:two_tails',
  'urn:decentraland:off-chain:base-avatars:moptop',
  'urn:decentraland:off-chain:base-avatars:curtained_hair',
  'urn:decentraland:off-chain:base-avatars:cool_hair',
  'urn:decentraland:off-chain:base-avatars:keanu_hair',
  'urn:decentraland:off-chain:base-avatars:slicked_hair',
  'urn:decentraland:off-chain:base-avatars:hair_oldie',
  'urn:decentraland:off-chain:base-avatars:punk',
  'urn:decentraland:off-chain:base-avatars:rasta',
  'urn:decentraland:off-chain:base-avatars:semi_afro',
  'urn:decentraland:off-chain:base-avatars:semi_bold',
  'urn:decentraland:off-chain:base-avatars:short_hair',
  'urn:decentraland:off-chain:base-avatars:casual_hair_01',
  'urn:decentraland:off-chain:base-avatars:casual_hair_02',
  'urn:decentraland:off-chain:base-avatars:casual_hair_03',
  'urn:decentraland:off-chain:base-avatars:tall_front_01',
  'urn:decentraland:off-chain:base-avatars:f_african_leggins',
  'urn:decentraland:off-chain:base-avatars:f_capris',
  'urn:decentraland:off-chain:base-avatars:f_brown_skirt',
  'urn:decentraland:off-chain:base-avatars:f_brown_trousers',
  'urn:decentraland:off-chain:base-avatars:f_country_pants',
  'urn:decentraland:off-chain:base-avatars:f_diamond_leggings',
  'urn:decentraland:off-chain:base-avatars:distressed_black_Jeans',
  'urn:decentraland:off-chain:base-avatars:elegant_blue_trousers',
  'urn:decentraland:off-chain:base-avatars:f_jeans',
  'urn:decentraland:off-chain:base-avatars:f_red_comfy_pants',
  'urn:decentraland:off-chain:base-avatars:f_red_modern_pants',
  'urn:decentraland:off-chain:base-avatars:f_roller_leggings',
  'urn:decentraland:off-chain:base-avatars:f_school_skirt',
  'urn:decentraland:off-chain:base-avatars:f_short_blue_jeans',
  'urn:decentraland:off-chain:base-avatars:f_short_colored_leggins',
  'urn:decentraland:off-chain:base-avatars:f_sport_shorts',
  'urn:decentraland:off-chain:base-avatars:f_stripe_long_skirt',
  'urn:decentraland:off-chain:base-avatars:f_stripe_white_pants',
  'urn:decentraland:off-chain:base-avatars:f_yoga_trousers',
  'urn:decentraland:off-chain:base-avatars:basketball_shorts',
  'urn:decentraland:off-chain:base-avatars:brown_pants_02',
  'urn:decentraland:off-chain:base-avatars:cargo_shorts',
  'urn:decentraland:off-chain:base-avatars:comfortablepants',
  'urn:decentraland:off-chain:base-avatars:grey_joggers',
  'urn:decentraland:off-chain:base-avatars:hip_hop_joggers',
  'urn:decentraland:off-chain:base-avatars:kilt',
  'urn:decentraland:off-chain:base-avatars:brown_pants',
  'urn:decentraland:off-chain:base-avatars:oxford_pants',
  'urn:decentraland:off-chain:base-avatars:safari_pants',
  'urn:decentraland:off-chain:base-avatars:jean_shorts',
  'urn:decentraland:off-chain:base-avatars:soccer_pants',
  'urn:decentraland:off-chain:base-avatars:pijama_pants',
  'urn:decentraland:off-chain:base-avatars:striped_swim_suit',
  'urn:decentraland:off-chain:base-avatars:swim_short',
  'urn:decentraland:off-chain:base-avatars:trash_jean',
  'urn:decentraland:off-chain:base-avatars:f_mouth_00',
  'urn:decentraland:off-chain:base-avatars:f_mouth_01',
  'urn:decentraland:off-chain:base-avatars:f_mouth_02',
  'urn:decentraland:off-chain:base-avatars:f_mouth_03',
  'urn:decentraland:off-chain:base-avatars:f_mouth_04',
  'urn:decentraland:off-chain:base-avatars:f_mouth_05',
  'urn:decentraland:off-chain:base-avatars:f_mouth_06',
  'urn:decentraland:off-chain:base-avatars:f_mouth_07',
  'urn:decentraland:off-chain:base-avatars:f_mouth_08',
  'urn:decentraland:off-chain:base-avatars:mouth_00',
  'urn:decentraland:off-chain:base-avatars:mouth_01',
  'urn:decentraland:off-chain:base-avatars:mouth_02',
  'urn:decentraland:off-chain:base-avatars:mouth_03',
  'urn:decentraland:off-chain:base-avatars:mouth_04',
  'urn:decentraland:off-chain:base-avatars:mouth_05',
  'urn:decentraland:off-chain:base-avatars:mouth_06',
  'urn:decentraland:off-chain:base-avatars:mouth_07',
  'urn:decentraland:off-chain:base-avatars:blue_bandana',
  'urn:decentraland:off-chain:base-avatars:diamond_colored_tiara',
  'urn:decentraland:off-chain:base-avatars:green_stone_tiara',
  'urn:decentraland:off-chain:base-avatars:laurel_wreath',
  'urn:decentraland:off-chain:base-avatars:red_bandana',
  'urn:decentraland:off-chain:base-avatars:bee_t_shirt',
  'urn:decentraland:off-chain:base-avatars:black_top',
  'urn:decentraland:off-chain:base-avatars:simple_blue_tshirt',
  'urn:decentraland:off-chain:base-avatars:f_blue_elegant_shirt',
  'urn:decentraland:off-chain:base-avatars:f_blue_jacket',
  'urn:decentraland:off-chain:base-avatars:brown_sleveless_dress',
  'urn:decentraland:off-chain:base-avatars:croupier_shirt',
  'urn:decentraland:off-chain:base-avatars:colored_sweater',
  'urn:decentraland:off-chain:base-avatars:elegant_striped_shirt',
  'urn:decentraland:off-chain:base-avatars:simple_green_tshirt',
  'urn:decentraland:off-chain:base-avatars:light_green_shirt',
  'urn:decentraland:off-chain:base-avatars:f_pink_simple_tshirt',
  'urn:decentraland:off-chain:base-avatars:f_pride_t_shirt',
  'urn:decentraland:off-chain:base-avatars:f_red_simple_tshirt',
  'urn:decentraland:off-chain:base-avatars:f_red_elegant_jacket',
  'urn:decentraland:off-chain:base-avatars:Red_topcoat',
  'urn:decentraland:off-chain:base-avatars:roller_outfit',
  'urn:decentraland:off-chain:base-avatars:school_shirt',
  'urn:decentraland:off-chain:base-avatars:baggy_pullover',
  'urn:decentraland:off-chain:base-avatars:f_sport_purple_tshirt',
  'urn:decentraland:off-chain:base-avatars:striped_top',
  'urn:decentraland:off-chain:base-avatars:f_sweater',
  'urn:decentraland:off-chain:base-avatars:f_body_swimsuit',
  'urn:decentraland:off-chain:base-avatars:f_white_shirt',
  'urn:decentraland:off-chain:base-avatars:white_top',
  'urn:decentraland:off-chain:base-avatars:f_simple_yellow_tshirt',
  'urn:decentraland:off-chain:base-avatars:lovely_yellow_shirt',
  'urn:decentraland:off-chain:base-avatars:black_jacket',
  'urn:decentraland:off-chain:base-avatars:blue_tshirt',
  'urn:decentraland:off-chain:base-avatars:elegant_sweater',
  'urn:decentraland:off-chain:base-avatars:green_square_shirt',
  'urn:decentraland:off-chain:base-avatars:green_tshirt',
  'urn:decentraland:off-chain:base-avatars:green_hoodie',
  'urn:decentraland:off-chain:base-avatars:pride_tshirt',
  'urn:decentraland:off-chain:base-avatars:puffer_jacket_hoodie',
  'urn:decentraland:off-chain:base-avatars:puffer_jacket',
  'urn:decentraland:off-chain:base-avatars:red_square_shirt',
  'urn:decentraland:off-chain:base-avatars:red_tshirt',
  'urn:decentraland:off-chain:base-avatars:safari_shirt',
  'urn:decentraland:off-chain:base-avatars:sleeveless_punk_shirt',
  'urn:decentraland:off-chain:base-avatars:soccer_shirt',
  'urn:decentraland:off-chain:base-avatars:sport_jacket',
  'urn:decentraland:off-chain:base-avatars:striped_pijama',
  'urn:decentraland:off-chain:base-avatars:striped_shirt_01',
  'urn:decentraland:off-chain:base-avatars:m_sweater',
  'urn:decentraland:off-chain:base-avatars:m_sweater_02',
  'urn:decentraland:off-chain:base-avatars:turtle_neck_sweater',
  // New wearables 2021-10-29
  'urn:decentraland:off-chain:base-avatars:yellow_tshirt',
  'urn:decentraland:off-chain:base-avatars:eyebrows_8',
  'urn:decentraland:off-chain:base-avatars:eyebrows_09',
  'urn:decentraland:off-chain:base-avatars:eyebrows_10',
  'urn:decentraland:off-chain:base-avatars:eyebrows_11',
  'urn:decentraland:off-chain:base-avatars:eyebrows_12',
  'urn:decentraland:off-chain:base-avatars:eyebrows_13',
  'urn:decentraland:off-chain:base-avatars:eyebrows_14',
  'urn:decentraland:off-chain:base-avatars:eyebrows_15',
  'urn:decentraland:off-chain:base-avatars:eyebrows_16',
  'urn:decentraland:off-chain:base-avatars:eyebrows_17',
  'urn:decentraland:off-chain:base-avatars:eyes_12',
  'urn:decentraland:off-chain:base-avatars:eyes_13',
  'urn:decentraland:off-chain:base-avatars:eyes_14',
  'urn:decentraland:off-chain:base-avatars:eyes_15',
  'urn:decentraland:off-chain:base-avatars:eyes_16',
  'urn:decentraland:off-chain:base-avatars:eyes_17',
  'urn:decentraland:off-chain:base-avatars:eyes_18',
  'urn:decentraland:off-chain:base-avatars:eyes_19',
  'urn:decentraland:off-chain:base-avatars:eyes_20',
  'urn:decentraland:off-chain:base-avatars:eyes_21',
  'urn:decentraland:off-chain:base-avatars:eyes_22',
  'urn:decentraland:off-chain:base-avatars:corduroygreenpants',
  'urn:decentraland:off-chain:base-avatars:corduroypurplepants',
  'urn:decentraland:off-chain:base-avatars:corduroysandypants',
  'urn:decentraland:off-chain:base-avatars:mouth_09',
  'urn:decentraland:off-chain:base-avatars:mouth_10',
  'urn:decentraland:off-chain:base-avatars:mouth_11',
  'urn:decentraland:off-chain:base-avatars:skatercoloredlongsleeve',
  'urn:decentraland:off-chain:base-avatars:skaterquadlongsleeve',
  'urn:decentraland:off-chain:base-avatars:skatertriangleslongsleeve',
  'urn:decentraland:off-chain:base-avatars:denimdungareesblue',
  'urn:decentraland:off-chain:base-avatars:denimdungareesred',
  'urn:decentraland:off-chain:base-avatars:poloblacktshirt',
  'urn:decentraland:off-chain:base-avatars:polobluetshirt',
  'urn:decentraland:off-chain:base-avatars:polocoloredtshirt'
]

const BASE_EMOTES: EmoteId[] = [
  'handsair',
  'wave',
  'fistpump',
  'dance',
  'raiseHand',
  'clap',
  'money',
  'kiss',
  'headexplode',
  'shrug'
]

export type BaseItem = {
  id: string
}

export async function fetchAllBaseWearables<E extends BaseItem>(): Promise<E[]> {
  return BASE_WEARABLES.map((id) => ({ id } as E))
}

export async function fetchAllBaseEmotes<E extends BaseItem>(): Promise<E[]> {
  return BASE_EMOTES.map((id) => ({ id } as E))
}
