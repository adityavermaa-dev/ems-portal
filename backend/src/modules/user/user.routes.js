const express =
require("express");

const router =
express.Router();

const authMiddleware =
require("../../middlewares/auth.middleware");

const authorize =
require("../../middlewares/role.middleware");

const userController =
require("./user.controller");

router.use(
    authMiddleware
);

router.use(
    authorize("SUPER_ADMIN")
);

router.post(
    "/",
    userController.createUser
);

router.get(
    "/",
    userController.getUsers
);

router.get(
    "/:id",
    userController.getUserById
);

router.patch(
    "/:id",
    userController.updateUser
);

router.patch(
    "/:id/status",
    userController.updateStatus
);

router.patch(
    "/:id/reset-password",
    userController.resetPassword
);

module.exports =
router;