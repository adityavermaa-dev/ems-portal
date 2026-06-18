const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const userController = require("./user.controller");

router.use(authMiddleware);




router.get("/", authorize("SUPER_ADMIN", "HR", "BDE", "TELESALES"), userController.getUsers);
router.get("/:id", authorize("SUPER_ADMIN", "HR"), userController.getUserById);


router.post("/", authorize("SUPER_ADMIN"), userController.createUser);
router.patch("/:id", authorize("SUPER_ADMIN"), userController.updateUser);
router.patch("/:id/status", authorize("SUPER_ADMIN"), userController.updateStatus);
router.patch("/:id/reset-password", authorize("SUPER_ADMIN"), userController.resetPassword);

module.exports = router;