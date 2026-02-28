const { telegram_scraper } = require("./../src/telegram-scraper")
const http = require("http")

const serverport = process.env.PORT || 8080

function Item(id, url, content_text, images, date_published, videos) {
	this.id = id
	this.url = url
	this.title = content_text.slice(0, 100) + "..."
	this.content_html = `
		${videos.reduce((fullString, url) => fullString + `<video src=${url} alt=${url}/>`, "")}
		${images.reduce((fullString, url) => fullString + `<img src=${url} alt=${url}/>`, "")}
		<p>${content_text}</p>`
	this.date_published = date_published
}

const server = http.createServer(async (req, res) => {
	res.statusCode = 200
	res.setHeader("Content-Type", "application/feed+json")
	res.setHeader("Access-Control-Allow-Origin", "*")

	const telegram_channel = req.url.slice(1)
	// if (telegram_channel === "feed" || telegram_channel === "feed.xml" || telegram_channel === "rss" || telegram_channel === "rss.xml") {
	// 	res.end(null)
	// }

	console.log(JSON.stringify(telegram_channel))

	try {
		if (telegram_channel == "") {
			throw new Error(404)
		}
		const data = await telegram_scraper(telegram_channel)
		const result = JSON.parse(data)
		const feed = {
			version: "https://jsonfeed.org/version/1",
			title: result[0]["user_name"],
			description: "Feed generated from telegram",
			icon: result[0]["user_photo"],
			items: result.map(
				post =>
					new Item(post.data_post, post.message_url, post.message_text, post.message_photo, post.datetime, post.message_video),
			),
		}
		res.end(JSON.stringify(feed, null, 4))
	} catch (error) {
		res.setHeader("StatusCode", error.message)
		res.end(error.message)
	}
})

server.listen(serverport, () => {
	console.log(`Server running at ${serverport}`)
})
