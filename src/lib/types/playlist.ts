import type {
	Thumbnail,
	NextContinuationData,
	Artist,
	TitleEndpoint
} from '$lib/types'
// export interface Header {
// 	description: string
// 	title: string
// 	thumbnails: Thumbnail[]
// 	secondSubtitle?: string[] | string
// 	playlistId: string
// 	subtitles?: string
// }
// export interface Playlist {
// 	thumbnails?: Thumbnail[]
// 	continuation?: NextContinuationData
// 	contents: PlaylistItem[]
// }
export interface PlaylistSearch {
	playlistId: string
	metaData?: string | string[]
	browseId?: string
	hash?: string
	title: string
	type?: string
	thumbnails?: Thumbnail[]
	continuation?: NextContinuationData
}
export type Menu = {
	text: string
	playlistId?: string
	videoId?: string
	params?: string
	browseId?: string
}
export interface IPlaylistItem {
	navigation?: Menu[]
	length?: string
	title: string | TitleEndpoint
	thumbnail: Thumbnail[]
	artist: Artist
	videoId?: string
	playlistId?: string
}

export type Header = {
	description: string
	subtitles: []
	thumbnails: []
	playlistId: string
	secondSubtitle: []
	title: string
}

export type PlaylistData = {
	continuations: NextContinuationData
	header: Header
	contents: IPlaylistItem[]
}