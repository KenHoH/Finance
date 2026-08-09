import { NextRequest, NextResponse } from "next/server";
import { appendFileSync } from "fs";
import { join } from "path";

const LOG_FILE = join(process.cwd(), "oauth-debug.log");

function log(msg: string){
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try{
    appendFileSync(LOG_FILE, line);
  }catch{}
}

function parseCookieValue(setCookieHeader: string): { name: string; value: string } | null{
  const eqIdx = setCookieHeader.indexOf("=");
  if(eqIdx === -1) return null;
  const name = setCookieHeader.substring(0, eqIdx).trim();
  const rest = setCookieHeader.substring(eqIdx + 1);
  const semiIdx = rest.indexOf(";");
  const rawValue = semiIdx === -1 ? rest : rest.substring(0, semiIdx);
  try{
    return { name, value: decodeURIComponent(rawValue.trim()) };
  }catch{
    return { name, value: rawValue.trim() };
  }
}

export async function GET(request: NextRequest){
  log("===== OAUTH CALLBACK CALLED =====");
  log("full url: " + request.url);
  log("nextUrl.origin: " + request.nextUrl.origin);
  log("host header: " + (request.headers.get("host") || "(none)"));
  log("x-forwarded-host: " + (request.headers.get("x-forwarded-host") || "(none)"));

  const FRONTEND_URL = (process.env.FRONTEND_URL || request.nextUrl.origin).replace(/\/+$/, "");

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  log("code present: " + !!code);
  log("state present: " + !!state);

  if(!code){
    log("ERROR: missing code param");
    return NextResponse.redirect(new URL("/login", FRONTEND_URL));
  }

  const rawBackend = process.env.BACKEND_URL || "http://localhost:3001";
  const backendUrl = rawBackend.replace(/\/+$/, "");
  log("backend url: " + backendUrl);

  if(!backendUrl.startsWith("http")){
    log("ERROR: backend url invalid: " + backendUrl);
    return NextResponse.redirect(new URL("/login", FRONTEND_URL));
  }

  const callbackUrl = new URL("/auth/google/callback", backendUrl);
  callbackUrl.searchParams.set("code", code);
  if(state){
    callbackUrl.searchParams.set("state", state);
  }
  log("proxy target: " + callbackUrl.toString());

  let backendRes: Response;
  try{
    backendRes = await fetch(callbackUrl.toString(), {
      redirect: "manual",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
  }catch(e){
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR: fetch failed: " + msg);
    return NextResponse.redirect(new URL("/login", FRONTEND_URL));
  }

  const status = backendRes.status;
  log("backend status: " + status);
  log("backend location header: " + (backendRes.headers.get("location") || "(none)"));

  if(status === 0){
    log("ERROR: fetch returned status 0 - possible CORS/network block");
    return NextResponse.redirect(new URL("/login", FRONTEND_URL));
  }

  if(status >= 300 && status < 400){
    log("backend sent redirect (" + status + ")");
    const setCookies = backendRes.headers.getSetCookie();
    log("set-cookie count: " + setCookies.length);

    const cookies = new Map<string, string>();
    for(const raw of setCookies){
      const parsed = parseCookieValue(raw);
      if(parsed){
        log("  cookie name: " + parsed.name + " value length: " + parsed.value.length);
        cookies.set(parsed.name, parsed.value);
      }
    }

    if(!cookies.has("token")){
      log("ERROR: backend 302 but NO token cookie found!");
      log("  cookies found: " + (Array.from(cookies.keys()).join(",") || "(none)"));
      return NextResponse.redirect(new URL("/login", FRONTEND_URL));
    }

    log("SUCCESS: token cookie found, redirecting to /dashboard");
    log("FRONTEND_URL used: " + FRONTEND_URL);

    const response = NextResponse.redirect(new URL("/dashboard", FRONTEND_URL));
    response.cookies.set("token", cookies.get("token")!, {
      httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60,
    });
    if(cookies.has("csrf-token")){
      response.cookies.set("csrf-token", cookies.get("csrf-token")!, {
        httpOnly: false, secure: false, sameSite: "lax", path: "/", maxAge: 60 * 60,
      });
    }
    return response;
  }

  if(status >= 400){
    let body = "";
    try{ body = await backendRes.text(); }catch{}
    log("ERROR: backend returned " + status + " body: " + body.substring(0, 300));
    return NextResponse.redirect(new URL("/login", FRONTEND_URL));
  }

  let body = "";
  try{ body = await backendRes.text(); }catch{}
  log("ERROR: unexpected status " + status + " body: " + body.substring(0, 300));
  return NextResponse.redirect(new URL("/login", FRONTEND_URL));
}
