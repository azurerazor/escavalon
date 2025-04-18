import { Request, Response, Router } from "express";

import { requireAuth } from "@api/middleware/auth.js";
import Stats from "@api/models/Stats.js";
import User from "@api/models/User.js";

// Set up the Express router
const router = Router();
router.use(requireAuth);

/**
 * Removes fields from a stat block that should not be exposed to the client
 */
function statsToJson(stats: InstanceType<typeof Stats>): object {
  const json = stats.toJSON();
  const { user, _id, __v, ...res } = json;
  return res;
}

// Fetches stats for a given username (or the currently authenticated user, if omitted)
router.get("/user/:forUser?", async (req: Request, res: Response) => {
  // Fetch stats for the user
  const forUser = req.params.forUser ?? res.locals.user;
  const stats = await Stats.findOne({ user: forUser });

  // Check if the stat block exists
  if (!stats) {
    // If the user exists but the stat block doesn't, create it
    const user = await User.findOne({ username: forUser });
    if (user) {
      // Creating the stat block record should initialize to defaults (zeroes)
      const newStats = await Stats.create({ user: forUser });
      res.status(200).json(statsToJson(newStats));
      return;
    }

    // If the user doesn't exist, return a 404
    res.status(404).json({ message: "User does not exist" });
    return;
  }

  // Respond
  res.status(200).json(statsToJson(stats));
});

// Fetches top stats for a given stat type
router.get("/top/:statKey/:num(\\d+)?", async (req: Request, res: Response) => {
  // Check that the stat key is one of Stats' properties
  const statKey = req.params.statKey;
  if (!Stats.schema.paths[statKey]) {
    res.status(400).json({ message: "Invalid stat key" });
    return;
  }

  // Fetch the top `num` stats for the given stat key
  const num = parseInt(req.params.num) ?? 10;
  const stats = (
    await Stats.find()
      .sort({ [statKey]: "descending" })
      .limit(num)
  ).map(statsToJson);

  // Respond
  res.status(200).json(stats);
});

export default router;
