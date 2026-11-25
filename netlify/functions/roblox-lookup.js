exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=300"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const rawUsername = (event.queryStringParameters && event.queryStringParameters.u) || "";
  const username = String(rawUsername).trim();

  if (!username) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "empty_username" })
    };
  }

  try {
    const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false
      })
    });

    if (!userRes.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ ok: false, error: "roblox_users_api_failed" })
      };
    }

    const userJson = await userRes.json();
    const user = userJson && Array.isArray(userJson.data) ? userJson.data[0] : null;

    if (!user || !user.id) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ ok: false, error: "user_not_found" })
      };
    }

    const thumbUrl =
      "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" +
      encodeURIComponent(user.id) +
      "&size=150x150&format=Png&isCircular=false";

    let avatarUrl = "";
    const thumbRes = await fetch(thumbUrl, {
      headers: { "Accept": "application/json" }
    });

    if (thumbRes.ok) {
      const thumbJson = await thumbRes.json();
      if (thumbJson && Array.isArray(thumbJson.data) && thumbJson.data[0] && thumbJson.data[0].imageUrl) {
        avatarUrl = thumbJson.data[0].imageUrl;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        id: user.id,
        username: user.name || username,
        displayName: user.displayName || user.name || username,
        avatarUrl: avatarUrl
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "server_error" })
    };
  }
};
