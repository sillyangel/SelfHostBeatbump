import { extractPrefsFromLocals } from "$lib/server/locals";
import type { RequestHandler } from "@sveltejs/kit";
import { buildAPIRequest } from "../api/_lib/request";

export const prerender = false;

export const GET: RequestHandler = async ({ url }) => {
	const { restricted } = extractPrefsFromLocals(locals);
	const query = url.searchParams;
	const browseId = query.get("browseId");
	const response = await buildAPIRequest("browse", {
		context: {
			client: { clientName: "WEB_REMIX", clientVersion: "1.20230501.01.00" },
			user: {
				lockedSafetyMode: restricted,
			},
		},
		headers: null,
		params: { browseId: browseId },
	});

	const data = await response?.json();

	const contents =
		data.contents?.singleColumnBrowseResultsRenderer?.tabs[0]?.tabRenderer
			?.content?.sectionListRenderer?.contents;
	const sections = [];
	for (let index = 0; index < contents.length; index++) {
		const { gridRenderer } = contents[index];
		const { items = [], header = {} } = gridRenderer;

		for (let i = 0; i < items.length; i++) {
			const item = items[i]?.musicNavigationButtonRenderer;
			items[i] = {
				text: item?.buttonText?.runs[0]?.text,
				color: `#${(
					"00000000" + (item?.solid?.leftStripeColor & 0xffffff).toString(16)
				).slice(-6)}`,
				endpoint: {
					params: item?.clickCommand?.browseEndpoint?.params,
					browseId: item?.clickCommand?.browseEndpoint?.browseId,
				},
			};
		}
		sections.push({
			section: items,
			title: header?.gridHeaderRenderer?.title?.runs[0]?.text,
		});
	}

	return new Response(JSON.stringify(sections));
};