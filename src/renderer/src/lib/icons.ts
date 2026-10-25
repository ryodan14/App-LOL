const DDRAGON = 'https://ddragon.leagueoflegends.com'
const COMMUNITY_DRAGON = 'https://raw.communitydragon.org/latest'

export function championIconUrl(image: string, patch: string): string {
  return `${DDRAGON}/cdn/${patch}/img/champion/${image}`
}

export function championSplashUrl(championId: string): string {
  return `${DDRAGON}/cdn/img/champion/splash/${championId}_0.jpg`
}

export function championLoadingUrl(championId: string): string {
  return `${DDRAGON}/cdn/img/champion/loading/${championId}_0.jpg`
}

export function itemIconUrl(image: string, patch: string): string {
  return `${DDRAGON}/cdn/${patch}/img/item/${image}`
}

export function spellIconUrl(image: string, patch: string): string {
  return `${DDRAGON}/cdn/${patch}/img/spell/${image}`
}

export function passiveIconUrl(image: string, patch: string): string {
  return `${DDRAGON}/cdn/${patch}/img/passive/${image}`
}

export function runeIconUrl(icon: string): string {
  return `${DDRAGON}/cdn/img/${icon}`
}

export function profileIconUrl(iconId: number, patch: string): string {
  return `${DDRAGON}/cdn/${patch}/img/profileicon/${iconId}.png`
}

export function communityDragonAsset(path: string): string {
  return `${COMMUNITY_DRAGON}/${path.replace(/^\/+/, '')}`
}
