const escalationService = require("../services/escalationService");
const { success } = require("../utils/response");

async function create(req, res, next) {
  try {
    const escalation = await escalationService.createEscalation(req.body);
    success(res, escalation, 201);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const escalation = await escalationService.getEscalationById(req.params.id);
    success(res, escalation, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById };
