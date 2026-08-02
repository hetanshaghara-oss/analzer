const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const monitoring = require("../controllers/monitoringController");

// All monitoring endpoints operate on the signed-in user's personal watchlist.
router.use(requireAuth);

router.get("/", monitoring.listWatchlists);
router.post("/", monitoring.addWatchlist);
router.get("/:username", monitoring.getWatchlistDetail);
router.delete("/:username", monitoring.removeWatchlist);
router.post("/:username/refresh", monitoring.refreshWatchlist);
router.post("/:username/read", monitoring.markWatchlistRead);

module.exports = router;
