export interface Song {
	index?: number;
	itct?: string;
	title?: string;
	artistInfo: ArtistInfo;
	videoId: string;
	playlistId?: string;
	params?: string;
	autoMixList?: string;
	thumbnails: [{ url: string }];
	length?: string;
	explicit?: string;
	hash?: string;
}

export interface Continuation {
	nextContinuationData: NextContinuationData;
}

export interface NextContinuationData {
	continuation: string;
	clickTrackingParams: string;
}

export interface TitleEndpoint {
	title: string;
	playlistId: string;
	videoId: string;
}
export interface Artist {
	browseId: string;
	name: string;
}
export interface Thumbnail {
	url: string;
}

export interface Playlist {
	playlistId: string;
	metaData?: string | string[];
	browseId?: string;
	hash?: string;
	title: string;
	type?: string;
	thumbnails?: Thumbnail[];
	continuation?: NextContinuationData;
	contents: PlaylistItem[];
}
export interface PlaylistSearch {
	playlistId: string;
	metaData?: string | string[];
	browseId?: string;
	hash?: string;
	title: string;
	type?: string;
	thumbnails?: Thumbnail[];
	continuation?: NextContinuationData;
}
export interface PlaylistItem {
	length?: string;
	title: string | TitleEndpoint;
	artist: Artist;
	thumbnail: Thumbnail[];
	videoId?: string;
	playlistId?: string;
}
export interface ArtistInfo {
	pageType?: string;
	artists?: [];
	browseId?: string;
}

export interface Subtitle {
	text: string;
	browseId: string;
	pageType: string;
}

export interface SearchResult {
	title: string;
	artist?: string;
	endpoint?: string;
	videoId: string;
	playlistId: string;
	params?: string;
	thumbnails: [{ url: string }];
	subtitle?: Subtitle[];
}
export interface CarouselItem {
	title: string;
	artist?: string;
	endpoint?: string;
	videoId: string;
	playlistId: string;
	params?: string;
	thumbnails: [{ url: string }[]];
	subtitle?: Subtitle[];
}

export interface mixList {
	continuation: string;
	autoMixList?: string;
	artistId?: string;
	itct?: string;
	index?: number;
	videoId: string;
	title: string;
	id?: number;
	artist: string;
	thumbnail?: string;
	length: string;
}