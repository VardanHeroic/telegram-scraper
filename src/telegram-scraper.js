//! Copyright Nuzulul Zulkarnain. Released under The MIT License.
//! telegram-scraper -- https://github.com/nuzulul/telegram-scraper

import html_parser from "./html-parser.js"

import https from "https"

export async function telegram_scraper(channel) {
	function HtmlEntitiesDecode(string) {
		string = string.replace(/&quot;/g, '"')
		string = string.replace(/&amp;/g, "&")
		string = string.replaceAll("&nbsp;", " ")
		string = string.replaceAll("&#39;", "'")
		return string
	}

	function get(targeturl, resolve, reject) {
		https.get(targeturl, res => {
			if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location != undefined) {
				return get(res.headers.location, resolve)
			}

			if (res.statusCode / 100 > 4) {
				reject(new Error(res.statusCode))
			}

			let data = []

			res.on("data", chunk => {
				data.push(chunk)
			})

			res.on("end", () => {
				try {
					const raw = Buffer.concat(data).toString()

					resolve(raw)
				} catch (err) {
					let msg = JSON.stringify({ status: "error", msg: err, targeturl })

					resolve(msg)
				}
			})
		})
	}

	async function get_page(targeturl) {
		return new Promise((resolve, reject) => {
			get(targeturl, resolve, reject)
		})
	}

	const targeturl = "https://t.me/s/" + channel
	let rawdata = null
	try {
		rawdata = await get_page(targeturl)
	} catch (error) {
		console.log(error)
		throw error
	}

	let temp = rawdata

	if (temp.indexOf('<section class="tgme_channel_history js-message_history">') == -1) return "Unknown telegram channel"

	temp = temp.split('<section class="tgme_channel_history js-message_history">')

	temp = temp[1].split("</section>")

	temp = temp[0].split('<div class="tgme_widget_message_wrap js-widget_message_wrap">')

	temp.splice(0, 1)

	let data = []

	for (var i = 0; i < temp.length; i++) {
		let html = '<div class="tgme_widget_message_wrap js-widget_message_wrap">' + temp[i]

		let arr = html_parser(html)

		let message_text = ""

		let message_photo = []

		let message_video = []

		let views = ""

		let datetime = ""

		let include = true

		const post = arr[0].children[0].children[3].children //tgme widget mesage bubble its one

		for (var j = 0; j < post.length; j++) {
			let child_class = ""
			try {
				child_class = post[j].attributes.class
			} catch { }

			if (child_class == "tgme_widget_message_roundvideo_player js-message_roundvideo_player") {
				try {
					message_video.push(post[j].children[1].children[3].attributes.src)
				} catch { }
			}

			if (child_class == "tgme_widget_message_poll js-poll") {
				message_text += " [Poll]"
			}

			if (child_class == "tgme_widget_message_text js-message_text") {
				function message_extractor(input) {
					let msg = ""

					function loop(arr) {
						for (let k = 0; k < arr.length; k++) {
							if (arr[k].text != null) msg += arr[k].text

							try {
								if (arr[k].attributes.class == "tgme_widget_service_strong_text") include = false
							} catch { }

							if (arr[k].children != null) {
								if (arr[k].children.length > 0) loop(arr[k].children)
							}
						}
					}

					loop(input)

					return msg.replaceAll("/>", " ")
				}

				let message_node = post[j].children

				message_text = message_extractor(message_node)
			}

			let arr_child_class = child_class.split(" ")

			if (arr_child_class[0] == "tgme_widget_message_photo_wrap") {
				message_photo.push(post[j].attributes.style.split("'")[1])
			}

			if (child_class == "tgme_widget_message_footer compact js-message_footer") {
				let get_views = post[j].children[1].children[1].children[0].text

				if (get_views != null) views = get_views
				try {
					datetime = post[j].children[1].children[3].children[2].children[0].attributes.datetime
				} catch { }
				try {
					datetime = post[j].children[1].children[5].children[2].children[0].attributes.datetime
				} catch { }
				try {
					datetime = post[j].children[1].children[5].children[1].children[0].attributes.datetime
				} catch { }
				try {
					datetime = post[j].children[1].children[5].children[0].children[0].attributes.datetime
				} catch { }
				try {
					datetime = post[j].children[1].children[3].children[1].children[0].attributes.datetime
				} catch { }
				try {
					datetime = post[j].children[1].children[3].children[0].children[0].attributes.datetime
				} catch { }
			}

			if (child_class == "tgme_widget_message_video_player blured js-message_video_player") {
				message_video.push(post[j].children[4].children[1].attributes.src)
			}

			if (child_class == "tgme_widget_message_video_player js-message_video_player") {
				message_video.push(post[j].children[2].children[1].attributes.src)
			}

			if (child_class == "media_supported_cont") {
				try {
					let url = post[j].children[0].attributes.style
						.split(";")
						.find(element => element.includes("background-image"))
						.slice(22, -2)

					message_photo.push(url)
				} catch { }

				try {
					post[j].children[0].children[0].children[0].children[1].children[1].children.forEach(element => {
						if (element.tag == "a") {
							message_photo.push(
								element.attributes.style
									.split(";")
									.find(element => element.includes("background-image"))
									.slice(22, -2),
							)
						}
					})
				} catch { }

				try {
					let src = post[j].children[0].children[2].attributes.src

					if (src != null) message_video.push(src)
				} catch { }

				try {
					let src = post[j].children[0].children[2].children[1].attributes.src

					if (src != null) message_video.push(src)
				} catch { }

				try {
					function message_extractor(input) {
						let msg = ""

						function loop(arr) {
							for (let k = 0; k < arr.length; k++) {
								if (arr[k].text != null) msg += arr[k].text

								try {
									if (arr[k].attributes.class == "tgme_widget_service_strong_text") include = false
								} catch { }

								if (arr[k].children != null) {
									if (arr[k].children.length > 0) loop(arr[k].children)
								}
							}
						}

						loop(input)

						return msg.replaceAll("/>", " ")
					}

					let message_node = null
					if (!post[j].children[1]) {
						message_node = post[j].children[0].children[0].children[1].children
					} else {
						message_node = post[j].children[1].children
					}
					message_text = message_extractor(message_node)
				} catch { }
			}

			if (child_class == "tgme_widget_message_grouped_wrap js-message_grouped_wrap") {
				function loop(node) {
					for (let k = 0; k < node.length; k++) {
						try {
							if (node[k].attributes.class != null) {
								if (node[k].attributes.class == "tgme_widget_message_video js-message_video")
									message_video.push(node[k].attributes.src)
							}
						} catch { }

						try {
							if (node[k].attributes.class != null) {
								if (
									node[k].attributes.class == "tgme_widget_message_photo_wrap grouped_media_wrap blured js-message_photo"
								) {
									let photo = node[k].attributes.style.split("'")[1]

									message_photo.push(photo)
								}
							}
						} catch { }

						if (node[k].children != null) {
							if (node[k].children.length > 0) loop(node[k].children)
						}
					}
				}

				let node = post[j].children

				loop(node)
			}
		}

		let item = {
			//raw:arr[0],

			data_post: arr[0].children[0].attributes["data-post"],

			data_view: arr[0].children[0].attributes["data-view"],

			user_url: arr[0].children[0].children[1].children[0].attributes.href,

			user_photo: arr[0].children[0].children[1].children[0].children[0].children[0].attributes.src,

			user_name: post[3].children[0].children[0].children[0].text,

			message_url: "https://t.me/" + arr[0].children[0].attributes["data-post"],

			message_text: HtmlEntitiesDecode(message_text),

			message_photo,

			message_video,

			views,

			datetime,
		}

		if (include) data.push(item)
	}

	let result = JSON.stringify(data, null, 30)

	return result
}
