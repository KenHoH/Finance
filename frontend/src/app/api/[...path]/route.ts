import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_URL || "https://footsore-uptake-autopilot.ngrok-free.dev").replace(/\/+$/, "");

async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>){
  const { path } = await params;
  const targetPath = "/" + path.join("/");
  const url = new URL(targetPath, BACKEND_URL);
  url.search = request.nextUrl.search;

  const incomingCookie = request.headers.get("cookie");
  const csrfToken = request.cookies.get("csrf-token")?.value;

  const headers = new Headers();
  headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
  headers.set("ngrok-skip-browser-warning", "true");

  if(incomingCookie){
    headers.set("Cookie", incomingCookie);
    console.log("[API Proxy] Cookie forwarded for:", targetPath);
  } else {
    console.log("[API Proxy] No cookie in request for:", targetPath);
  }

  if(csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)){
    headers.set("X-CSRF-Token", csrfToken);
  }

  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

  const backendRes = await fetch(url.toString(), {
    method: request.method,
    headers,
    body: body?.byteLength ? body : undefined,
    redirect: "manual",
  });

  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if(lower === "set-cookie" || lower === "content-encoding"){
      return; // handled separately below
    }
    if(lower !== "transfer-encoding"){
      resHeaders.set(key, value);
    }
  });

  // Forward Set-Cookie headers individually — Headers.set() collapses multiple values
  const setCookies = backendRes.headers.getSetCookie ? backendRes.headers.getSetCookie() : [];
  for(const cookie of setCookies){
    resHeaders.append("Set-Cookie", cookie);
  }

  // Pass through redirect responses so the browser follows them
  if(backendRes.status >= 300 && backendRes.status < 400){
    return new NextResponse(null, {
      status: backendRes.status,
      headers: resHeaders,
    });
  }

  const resBody = await backendRes.arrayBuffer();

  return new NextResponse(resBody, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }){
  return proxyRequest(request, context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }){
  return proxyRequest(request, context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }){
  return proxyRequest(request, context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }){
  return proxyRequest(request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }){
  return proxyRequest(request, context.params);
}
