// Routes for role management
import { Router } from "express";
import { 
  getAllRoles, 
  createRole, 
  updateRole, 
//   deleteRole, 
  getRolePermissions, 
  updateRolePermissions,
  getIgotRolesList
} from "../controllers/roles.controller";
import { userSession } from "../helpers/authHelper";

const rolesRouter = Router();

// Role CRUD routes
rolesRouter.get("/", getAllRoles)
rolesRouter.post("/create", createRole);
rolesRouter.put("/update/:id", updateRole);
// router.delete("/roles/:id", deleteRole);

// // Role permissions routes
rolesRouter.get("/:roleId/permissions", getRolePermissions ,()=>{console.log("Role permissions fetched")});
rolesRouter.post("/update/:roleId/permissions", updateRolePermissions);
rolesRouter.route("/orgTypeList")
  .get(userSession, getIgotRolesList);
export default rolesRouter;