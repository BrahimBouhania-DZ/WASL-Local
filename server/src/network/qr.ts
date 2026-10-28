import { networkInterfaces } from 'os'

export function getLocalUrls(port: number) {
  const nets = networkInterfaces()
  const urls: string[] = []
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:${port}`)
      }
    }
  }
  return urls
}
