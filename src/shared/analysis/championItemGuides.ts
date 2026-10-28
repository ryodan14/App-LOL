import type { Item, Role } from '../types'
import type {
  ChampionItemGuideData,
  ChampionItemGuideSource,
  NormalizedChampionItemGuide
} from './championItemTypes'
import { GENERATED_CHAMPION_ITEM_GUIDES } from './data/championItemGuides.generated'

interface CuratedGuide {
  starting?: number[][]
  ranges: number[][]
}

const SUPPORT_STARTING = [[3865, 2003, 2003]]
const JUNGLE_STARTING = [[1101, 2003]]
const AD_STARTING = [[1055, 2003]]
const AP_STARTING = [[1056, 2003, 2003]]

const CURATED: Record<number, CuratedGuide> = {
  2: { starting: AD_STARTING, ranges: [[6631], [3047, 3111], [3053, 3071], [6333, 3156], [3078, 3748]] },
  5: { starting: AD_STARTING, ranges: [[6692, 6631], [3047, 3111], [3053, 3071], [6333, 3156], [3078, 3748]] },
  11: { starting: AD_STARTING, ranges: [[6672], [3006], [3124, 3153], [3091, 6333], [3036, 3026]] },
  16: { starting: SUPPORT_STARTING, ranges: [[6617], [3158], [3504, 6616], [3107, 3190], [3222, 2065]] },
  18: { starting: AD_STARTING, ranges: [[6672, 6673], [3006], [3031, 6675], [3036, 3033], [3026, 3095]] },
  19: { starting: JUNGLE_STARTING, ranges: [[3078, 6631], [3047, 3111], [3075, 3065], [6333, 3153], [3053, 3071]] },
  21: { starting: AD_STARTING, ranges: [[3508, 6672], [3006], [3031, 3036], [3033, 6676], [3026, 6675]] },
  23: { starting: AD_STARTING, ranges: [[6672, 6673], [3006], [3031, 3036], [6333, 3026], [3033, 3095]] },
  26: { starting: AP_STARTING, ranges: [[6617, 6655], [3020, 3158], [3102, 4629], [3089, 3135], [3165, 3504]] },
  29: { starting: AD_STARTING, ranges: [[6672], [3006], [3031, 3085], [3036, 3033], [3026, 6676]] },
  37: { starting: SUPPORT_STARTING, ranges: [[6617], [3158], [3504, 6616], [3107, 3222], [3190, 2065]] },
  38: { starting: AP_STARTING, ranges: [[6653, 6655], [3020], [3102, 3089], [3135, 4645], [3157, 4629]] },
  39: { starting: AD_STARTING, ranges: [[3078, 6631], [3047], [3153, 6333], [3053, 3091], [3071, 3161]] },
  43: { starting: SUPPORT_STARTING, ranges: [[6617, 6655], [3158], [3102, 4629], [3504, 3089], [3135, 3165]] },
  50: { starting: AP_STARTING, ranges: [[6653, 4633], [3020], [3116, 3157], [3089, 3135], [3165, 3102]] },
  51: { starting: AD_STARTING, ranges: [[6672, 6673], [3006], [3031, 3036], [3094, 3033], [3026, 6676]] },
  59: { starting: AD_STARTING, ranges: [[6692, 6631], [3047, 3111], [3053, 3071], [6333, 3161], [3078, 3748]] },
  62: { starting: AD_STARTING, ranges: [[6692, 6631], [3047], [3078, 3053], [6333, 3071], [3161, 3748]] },
  63: { starting: AP_STARTING, ranges: [[6653, 6655], [3020], [4645, 3165], [3089, 3135], [4629, 3157]] },
  64: { starting: JUNGLE_STARTING, ranges: [[6692, 6631], [3047, 3111], [3142, 3053], [6333, 3071], [3814, 3161]] },
  67: { starting: AD_STARTING, ranges: [[3153, 6672], [3006], [3124, 3036], [3026, 6675], [3091, 3033]] },
  74: { starting: AP_STARTING, ranges: [[6655, 6653], [3020], [4628, 3089], [3135, 3165], [3157, 3102]] },
  83: { starting: AD_STARTING, ranges: [[6631, 3078], [3047], [3748, 3053], [6333, 3071], [3161, 3075]] },
  92: { starting: AD_STARTING, ranges: [[6692, 6631], [3047], [3053, 3071], [6333, 3161], [3078, 3153]] },
  102: { starting: JUNGLE_STARTING, ranges: [[6631, 3078], [3047], [3748, 3053], [3071, 6333], [3161, 3156]] },
  104: { starting: JUNGLE_STARTING, ranges: [[6692, 6672], [3006], [3814, 6676], [3036, 3053], [3033, 3026]] },
  114: { starting: AD_STARTING, ranges: [[3078, 6631], [3047], [3153, 6333], [3053, 3071], [3161, 3026]] },
  119: { starting: AD_STARTING, ranges: [[3508, 6672], [3006], [3031, 3036], [6676, 3033], [3026, 6675]] },
  122: { starting: AD_STARTING, ranges: [[6631, 3078], [3047, 3111], [3053, 3071], [6333, 3748], [3156, 3075]] },
  126: { starting: AD_STARTING, ranges: [[6692, 6697], [3047], [3142, 3814], [3071, 3036], [6696, 6694]] },
  127: { starting: AP_STARTING, ranges: [[6655, 6653], [3020], [3157, 3089], [3135, 3102], [3165, 4629]] },
  131: { starting: AP_STARTING, ranges: [[6653, 4633], [3020], [3115, 3089], [3135, 3157], [3102, 4645]] },
  133: { starting: AD_STARTING, ranges: [[6692, 6672], [3006], [3031, 3814], [3036, 3033], [3026, 6676]] },
  141: { starting: JUNGLE_STARTING, ranges: [[6692, 6631], [3047], [3142, 3071], [6333, 3053], [3814, 3161]] },
  164: { starting: AD_STARTING, ranges: [[3078, 6631], [3047], [3748, 3053], [6333, 3071], [3161, 3153]] },
  166: { starting: AD_STARTING, ranges: [[6672, 6673], [3006], [3031, 3036], [6675, 3026], [3033, 6676]] },
  202: { starting: AD_STARTING, ranges: [[3508, 6673], [3006], [3031, 3036], [6676, 3033], [3026, 3094]] },
  203: { starting: JUNGLE_STARTING, ranges: [[6672], [3006], [3031, 3036], [6675, 3026], [3033, 3095]] },
  222: { starting: AD_STARTING, ranges: [[6672, 6673], [3006], [3031, 3085], [3036, 3033], [3026, 6676]] },
  236: { starting: AD_STARTING, ranges: [[6672, 6673], [3006], [3031, 6675], [3036, 6676], [3026, 3153]] },
  240: { starting: AD_STARTING, ranges: [[6631, 3078], [3047], [3053, 3071], [6333, 3748], [3161, 3075]] },
  254: { starting: JUNGLE_STARTING, ranges: [[6692, 6631], [3047], [3053, 3071], [6333, 3748], [3161, 3075]] },
  266: { starting: AD_STARTING, ranges: [[6692, 6631], [3047, 3111], [3053, 3071], [6333, 3161], [3156, 3748]] },
  360: { starting: AD_STARTING, ranges: [[6673, 6672], [3006], [3031, 3036], [6676, 3026], [3033, 3153]] },
  420: { starting: AD_STARTING, ranges: [[6631, 3078], [3047], [3748, 3053], [6333, 3075], [3071, 3161]] },
  427: { starting: JUNGLE_STARTING, ranges: [[6617, 6620], [3158], [3504, 6616], [3107, 3190], [3222, 2065]] },
  429: { starting: AD_STARTING, ranges: [[6672], [3006], [3031, 3036], [6675, 3026], [3033, 3153]] },
  498: { starting: AD_STARTING, ranges: [[6672], [3006], [3031, 3036], [6675, 3026], [3033, 3153]] },
  518: { starting: AP_STARTING, ranges: [[6655, 6653], [3020], [3089, 3135], [3157, 3165], [3102, 4629]] },
  523: { starting: AD_STARTING, ranges: [[6672, 6673], [3006], [3031, 3036], [6675, 3085], [3033, 3026]] },
  875: { starting: AD_STARTING, ranges: [[6631, 3078], [3047], [3053, 3071], [6333, 3748], [3161, 3075]] },
  902: { starting: SUPPORT_STARTING, ranges: [[6617], [3158], [3504, 6616], [3107, 3190], [3222, 2065]] }
}

export const CURATED_CHAMPION_ITEM_GUIDES: Record<number, ChampionItemGuideData> = Object.fromEntries(
  Object.entries(CURATED).map(([key, guide]) => [
    key,
    { source: 'curated', starting: guide.starting ?? [], ranges: guide.ranges }
  ])
)

function hasEntry(entry: { starting?: number[][]; ranges?: number[][] } | undefined): boolean {
  return Boolean(entry && ((entry.starting?.length ?? 0) > 0 || (entry.ranges?.length ?? 0) > 0))
}

function isBuildable(item: Item | undefined): item is Item {
  return Boolean(
    item &&
      item.maps['11'] === true &&
      item.gold.purchasable &&
      item.gold.total > 0 &&
      item.inStore !== false &&
      !item.requiredChampion
  )
}

function isBootsItem(item: Item | undefined): boolean {
  return Boolean(item?.tags.includes('Boots'))
}

function unique(values: number[]): number[] {
  return [...new Set(values)]
}

export function resolveChampionItemGuide(
  championKey: number,
  role: Role
): ChampionItemGuideData | null {
  const generated = GENERATED_CHAMPION_ITEM_GUIDES[championKey]
  const curated = CURATED_CHAMPION_ITEM_GUIDES[championKey]
  const base = generated ?? curated
  if (!base) return null

  const roleEntry = base.roles?.[role]
  if (hasEntry(roleEntry)) {
    return {
      source: base.source,
      starting: roleEntry?.starting ?? [],
      ranges: roleEntry?.ranges ?? []
    }
  }

  if (hasEntry(base)) {
    return { source: base.source, starting: base.starting ?? [], ranges: base.ranges ?? [] }
  }

  const fallbackRole = Object.values(base.roles ?? {}).find((entry) => hasEntry(entry))
  if (fallbackRole) {
    return {
      source: base.source,
      starting: fallbackRole.starting ?? [],
      ranges: fallbackRole.ranges ?? []
    }
  }

  return null
}

export function normalizeChampionItemGuide(
  guide: ChampionItemGuideData | null,
  itemById: Map<number, Item>
): NormalizedChampionItemGuide {
  if (!guide) {
    return {
      source: 'heuristic',
      starting: [],
      ranges: [],
      first: [],
      boots: [],
      core: [],
      situational: [],
      itemIds: []
    }
  }

  const starting = (guide.starting ?? [])
    .map((bundle) => bundle.filter((id) => isBuildable(itemById.get(id))))
    .filter((bundle) => bundle.length > 0)
  const groups = (guide.ranges ?? [])
    .map((range) => range.filter((id) => isBuildable(itemById.get(id))))
    .filter((range) => range.length > 0)

  const first: number[] = []
  const boots: number[] = []
  const core: number[][] = []
  const situational: number[][] = []

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index]
    const bootItems = group.filter((id) => isBootsItem(itemById.get(id)))
    const nonBoots = group.filter((id) => !isBootsItem(itemById.get(id)))

    boots.push(...bootItems)
    if (nonBoots.length === 0) continue

    if (index === 0 && first.length === 0) {
      first.push(...nonBoots)
    } else if (core.length < 2) {
      core.push(nonBoots)
    } else {
      situational.push(nonBoots)
    }
  }

  if (first.length === 0 && core.length > 0) {
    first.push(...(core.shift() ?? []))
  }

  const itemIds = unique([...first, ...boots, ...core.flat(), ...situational.flat()])

  return {
    source: guide.source,
    starting,
    ranges: groups,
    first,
    boots: unique(boots),
    core,
    situational,
    itemIds
  }
}

export function championItemGuideSource(source: ChampionItemGuideSource): string {
  return source
}
