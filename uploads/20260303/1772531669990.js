addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  let path = url.pathname.slice(1);  // 去掉开头的 /

  // 支持 https://你的域名/https://github.com/xxx/releases/download/...
  // 也支持 https://你的域名/github.com/xxx/releases/download/...
  if (path.startsWith('http/')) {
    path = path.replace(/^http\//, 'http://');
  } else if (path.startsWith('https/')) {
    path = path.replace(/^https\//, 'https://');
  } else if (!path.includes('://')) {
    path = 'https://' + path;
  }

  // 只代理 github 相关的域名
  if (!path.includes('github.com') && !path.includes('raw.githubusercontent.com') && !path.includes('objects.githubusercontent.com')) {
    return new Response('只支持 GitHub 相关链接', { status: 400 });
  }

  // 防止滥用，可选：加上简单的 referer 或 token 校验（生产环境建议加）

  let newRequest = new Request(path, {
    method: request.method,
    headers: request.headers,
    redirect: 'follow'
  });

  // 特别处理 GitHub Releases 的 objects.githubusercontent.com 下载链接
  newRequest.headers.set('Referer', 'https://github.com');
  newRequest.headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

  let response = await fetch(newRequest);

  // 让浏览器正确下载文件
  response = new Response(response.body, response);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.delete('Content-Security-Policy');
  response.headers.delete('Strict-Transport-Security');

  return response;
}