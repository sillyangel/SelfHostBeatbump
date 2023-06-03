/* eslint-disable @typescript-eslint/no-explicit-any */
import { error, json } from "@sveltejs/kit";
import { MusicResponsiveListItemRenderer } from "$lib/parsers";
import { iter, type Maybe } from "$lib/utils";
import { buildAPIRequest } from "$api/request";
import type { NextContinuationData } from "$lib/types";
import type { IMusicResponsiveListItemRenderer } from "$lib/types/innertube/internals";
import type { RequestHandler } from "./$types";
import type { SearchEndpointParams } from "$api/_base";
import type { MusicShelf } from "$lib/types/musicShelf";
import type { SearchFilter } from "$lib/types/api/search";
import { parseParams } from "$api/utils";
import { filterMapAsync } from "$lib/utils/collections/array";

const Filters = {
	all: "",
	songs: "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D",
	videos: "EgWKAQIQAWoKEAMQBBAJEAoQBQ%3D%3D",
	albums: "EgWKAQIYAWoKEAMQBBAJEAoQBQ%3D%3D",
	artists: "EgWKAQIgAWoKEAMQBBAJEAoQBQ%3D%3D",
	community_playlists: "EgeKAQQoAEABagwQDhAKEAkQAxAEEAU%3D",
	featured_playlists: "EgeKAQQoADgBagwQDhAKEAMQBBAJEAU%3D",
	all_playlists: "EgWKAQIoAWoKEAMQBBAKEAUQCQ%3D%3D",
} as const;

type SearchSchema = {
	ctoken?: string;
	itct?: string;
	filter: SearchFilter;
	q: string;
};

const parser = parseParams<SearchSchema>(["ctoken", "filter", "itct", "q"]);

export const GET: RequestHandler = async ({ url }) => {
	const queryParam = url.searchParams;

	const { q, filter, ctoken, itct } = parser(queryParam.entries());

	const rawFilterParam = Filters[filter] ?? undefined;
	try {
		const data = await buildAPIRequest<SearchEndpointParams>("search", {
			context: {
				client: {
					clientName: "WEB_REMIX",
					clientVersion: "1.20230501.01.00",
				},
			},
			params: {
				browseId: "",
				query: decodeURIComponent(q),
				params: filter !== "all" ? `${rawFilterParam}` : undefined,
			},
			headers: null,
			continuation:
				ctoken !== null
					? { continuation: ctoken, ctoken, itct: `${itct}`, type: "next" }
					: {},
		}).then((r) => {
			if (!r) throw Error("Failed to send the search request"); // No response returned
			if (!r.ok) throw Error(r.statusText); // Response status code >= 400

			return r.json();
		});

		const contents =
			data.contents?.tabbedSearchResultsRenderer.tabs[0]?.tabRenderer?.content
				?.sectionListRenderer?.contents;

		const continuationContents =
			data?.continuationContents?.musicShelfContinuation;
		const results = ctoken
			? await parseContinuation(continuationContents, filter as SearchFilter)
			: await parseContents(contents);

		return json(results);
	} catch (err) {
		console.error(err);
		throw error(500, err as string);
	}
};

async function parseContinuation(
	contents: Record<string, any>,
	filter: string & SearchFilter,
) {
	const continuation: Maybe<Partial<NextContinuationData>> =
		Array.isArray(contents?.continuations) &&
		contents?.continuations[0]?.nextContinuationData;
	const type = filter.includes("playlists") ? "playlists" : filter;

	const results = await parseResults(contents.contents, type);

	return {
		continuation,
		results,
		type: "next",
	};
}

async function parseContents(
	contents: {
		itemSectionRenderer?: unknown;
		musicShelfContinuation: Record<string, any>;
		musicCardShelfRenderer: Record<string, any>;
		musicShelfRenderer?: {
			continuations?: [{ nextContinuationData: NextContinuationData }];
			contents?: {
				musicResponsiveListItemRenderer: IMusicResponsiveListItemRenderer;
			}[];

			title?: { runs: [{ text: string }] };
		};
	}[] = [],
) {
	const continuation: Maybe<Partial<NextContinuationData>> = {};

	type DeepPartial<T extends Record<string, any>> = {
		[Key in keyof T]?: Exclude<T[Key], undefined | null> extends Record<
			string,
			any
		>
			? DeepPartial<T[Key]>
			: T[Key];
	};
	return {
		results: await filterMapAsync(
			contents,
			async (section) => {
				const shelf: DeepPartial<MusicShelf> = {
					contents: [],
					header: { title: "" },
				};

				/// PR: https://github.com/snuffyDev/Beatbump/pull/83
				if (section && section.itemSectionRenderer) {
					return Promise.resolve();
				}
				const musicShelf = section.musicShelfRenderer;
				if (musicShelf) {
					// Get the inner contents
					const items =
						Array.isArray(musicShelf.contents) && musicShelf.contents;

					// Gets the continuation tokens
					if (
						Array.isArray(musicShelf?.continuations) &&
						musicShelf?.continuations[0].nextContinuationData
					)
						Object.assign(
							continuation,
							musicShelf.continuations[0].nextContinuationData,
						);

					// If the section has an array at the property `contents` - parse it.
					if (musicShelf.title) {
						if (!shelf.header) shelf.header = {};
						shelf.header.title = musicShelf.title?.runs[0]?.text;
					}
					if (items) {
						const _results = await parseResults(
							items,
							shelf.header?.title?.toLowerCase().replace(/\s/gm, "_") as string,
						);
						shelf.contents = _results;
					}
					return shelf;
				} else {
					const musicCardShelfRenderer = section.musicCardShelfRenderer;
					const item: { buttons?: Record<string, any> } = {};
					item.buttons = musicCardShelfRenderer.buttons;
				}
			},
			Boolean,
		),
		continuation,
	};
}

function parseResults(items: any[], type: string) {
	return Promise.all(
		items.map(async (entry) => {
			const item = await MusicResponsiveListItemRenderer(entry);
			const _type =
				type === "top_result"
					? "endpoint" in item &&
					  (item.endpoint as any)?.pageType?.match(/SINGLE|ALBUM/i)
						? "albums"
						: type
					: type;
			Object.assign(item, {
				type: _type,
			});

			if (_type.includes("playlists") || _type === "albums") {
				let metaData = "";
				iter(item.subtitle, (subtitle) => (metaData += subtitle.text));

				Object.assign(item, {
					metaData: metaData,
					browseId:
						entry.musicResponsiveListItemRenderer?.navigationEndpoint
							?.browseEndpoint?.browseId,
					playlistId:
						entry.musicResponsiveListItemRenderer.menu?.menuRenderer?.items[0]
							?.menuNavigationItemRenderer?.navigationEndpoint
							?.watchPlaylistEndpoint?.playlistId,
				});
			}

			if (type === "songs") {
				Object.assign(item, {
					album:
						item.subtitle?.at?.(-3)?.pageType?.includes("ALBUM") &&
						item.subtitle.at(-3),
				});
			}

			return item;
		}),
	);
}
