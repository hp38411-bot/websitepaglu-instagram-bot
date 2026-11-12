const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;

const processed = new Set();

app.get("/", (req, res) => {
  res.send("WebsitePaglu Instagram Bot is running!");
});

// Instagram webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// Receive Instagram comments
app.post("/webhook", (req, res) => {
  res.sendStatus(200);

  const entries = req.body.entry || [];

  entries.forEach(entry => {
    const changes = entry.changes || [];

    changes.forEach(change => {
      if (change.field === "comments") {
        handleComment(change.value);
      }
    });
  });
});

async function handleComment(comment) {
  const commentId = comment.id;
  const userId = comment.from?.id;
  const username = comment.from?.username;
  const text = (comment.text || "").toLowerCase();
  const mediaId = comment.media?.id;

  if (!commentId || !userId || !username) return;

  if (processed.has(commentId)) return;

  // Keyword trigger
  if (!text.includes("link")) return;

  processed.add(commentId);

  // One minute delay
  await new Promise(resolve => setTimeout(resolve, 60000));

  try {
    // Public comment reply
    await axios.post(
      `https://graph.instagram.com/v23.0/${commentId}/replies`,
      {
        message: `@${username} Check your DM! 📩`
      },
      {
        params: {
          access_token: ACCESS_TOKEN
        }
      }
    );

    // Private reply to comment
    await axios.post(
      `https://graph.instagram.com/v23.0/${commentId}/messages`,
      {
        message: {
          text: "Hey! 👋 Thanks for commenting LINK. Here is your requested website: https://example.com"
        }
      },
      {
        params: {
          access_token: ACCESS_TOKEN
        }
      }
    );

    console.log("Automation completed:", username);

  } catch (error) {
    console.error(
      "Instagram API error:",
      error.response?.data || error.message
    );
  }
}

app.listen(PORT, () => {
  console.log("WebsitePaglu Bot running on port", PORT);
});
