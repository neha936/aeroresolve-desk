const express = require("express");
const { z } = require("zod");
const escalationController = require("../controllers/escalationController");
const { validate } = require("../middleware/validateMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

const createEscalationSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(1),
  requestedAction: z.record(z.string(), z.any()).optional(),
});

router.post("/", authMiddleware, validate(createEscalationSchema), escalationController.create);
router.get("/:id", authMiddleware, escalationController.getById);

module.exports = router;
