const CDN = "https://cdn.discordapp.com"

const cdnUrl = (route, size, format) => `${CDN}${route}.${format}?size=${size}`

module.exports.guildIcon = (id, hash, size = 4096, format = "png") => cdnUrl(`/icons/${id}/${hash}`, size, format)