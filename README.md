# WebPing

**WebPing** measures HTTP latency from your web browser to major cloud regions.

Demo available here: [https://webping.hleroy.com/](https://webping.hleroy.com/)

## Usage

**Locally**

You can retrieve all static files and dependencies in `html` folder. Open `ìndex.html` with a browser.

**With Docker**

A minimalist Docker container is provided to quickly deploy on a container platform.

```
docker build -t webping .
docker run -d --name webping webping
```

If you are running your containers behind [jwilder nginx-proxy](https://hub.docker.com/r/jwilder/nginx-proxy) and [letsencrypt-nginx-proxy-companion](https://github.com/nginx-proxy/docker-letsencrypt-nginx-proxy-companion), the `docker run` would look like:

```
docker run -d \
  --name webping \
  --restart=always \
  --network=yourproxynetwork \
  -e VIRTUAL_HOST=webping.yourdomain.com \
  -e LETSENCRYPT_HOST=webping.yourdomain.com \
  -e LETSENCRYPT_EMAIL=your@email.com \
  -e VIRTUAL_PORT=80 \
  webping
```

If you are running your containers behind [Traefik](https://hub.docker.com/_/traefik), the `docker run` would look like.

```
docker run -d \
  --name webping \
  --restart always \
  --network yourproxynetwork \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.webping.rule=Host('webping.yourdomain.com')" \
  --label "traefik.http.routers.webping.entrypoints=websecure" \
  --label "traefik.http.routers.webping.tls=true" \
  --label "traefik.http.routers.webping.tls.certresolver=letsencrypt" \
  webping
```

## How it works

### It's a bit tricky to measure latency from browsers!

JavaScript doesn't allow to send an ICMP ping (anyway, it's often blocked!)
Web browser [Same Origin Policy](https://en.wikipedia.org/wiki/Same-origin_policy) doesn't allow dynamically loading resources from another domain, unless there is a specific Cross-origin resource sharing (CORS) configuration.

The **first trick** ([discussed here on Stack Overflow](https://stackoverflow.com/questions/4282151/is-it-possible-to-ping-a-server-from-javascript)) is to load an image because <IMG> tags are exempted from Same Origin Policy ([see Mozilla Web Developer site for the complete list of exceptions](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)).

The **second trick** is to append a random query parameter. E.g.:

```javascript
img.src = url + "?no-cache=" + Math.floor((1 + Math.random()) * 0x10000).toString(16);
```

It avoids proxy/server caching and the server answers with a (usually short) 404 message. We don't really care about the answer. We just want to know how long the answer takes to come back.

The **third trick** is to capture the image onload event in JavaScript to calculate the time taken to get the answer from the server.

```javascript
img.onload = function () {
  resolve(img);
};
```

### How accurate is it?

The latency measured is actually an HTTP latency: it includes browser processing (quite minimal), network transit and web server processing (it can be significant). For small latencies (e.g. 5-10ms), it's probably 2 or 3 times higher than a typical ping. But for bigger latencies (>100ms), the difference with ICMP ping is less noticeable because the network transit part becomes larger.

## Release History

- 1.2.0

  - Added Microsoft targets (Teams, Outlook, Office Portal, Azure Portal)

- 1.1.0

  - Added IP information from ipinfo.io
  - Added best latency column and auto-sort on this column

- 1.0.0
  - Initial version

## Todo

- Add a worldmap with datacenter locations

## Meta

Hervé Le Roy – [@herveleroy](https://twitter.com/herveleroy) – hleroy@hleroy.com

Distributed under the MIT license. See `LICENSE` for more information.

[https://github.com/hleroy/webping](https://github.com/hleroy/webping)

## Contributing

1. Fork it (<https://github.com/hleroy/webping/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request
