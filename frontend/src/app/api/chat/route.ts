import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");

export async function POST(request: NextRequest){
  const incomingCookie = request.headers.get("cookie");
  const csrfToken = request.cookies.get("csrf-token")?.value;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("ngrok-skip-browser-warning", "true");

  if(incomingCookie){
    headers.set("Cookie", incomingCookie);
  }

  if(csrfToken){
    headers.set("X-CSRF-Token", csrfToken);
  }

  const body = await request.arrayBuffer();

  let backendRes: Response;
  try{
    backendRes = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers,
      body: body?.byteLength ? body : undefined,
    });
  } catch(fetchErr){
    console.error("[Chat Proxy] Failed to reach backend:", fetchErr);
    return NextResponse.json(
      { error: "Cannot reach chat backend" },
      { status: 502 }
    );
  }

  if(!backendRes.ok){
    const errBody = await backendRes.text().catch(() => "Chat request failed");
    console.error("[Chat Proxy] Backend error:", backendRes.status, errBody);
    return NextResponse.json(
      { error: errBody },
      { status: backendRes.status }
    );
  }

  if(!backendRes.body){
    return NextResponse.json(
      { error: "No response body from chat service" },
      { status: 502 }
    );
  }

  // Stream the response back to the client
  return new Response(backendRes.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
