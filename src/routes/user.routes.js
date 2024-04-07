import { Router } from "express";
const router = Router();
import { userAuth } from "../middlewares/userAuth.middleware.js";
import { isStudentAuth } from "../middlewares/isStudentAuth.middleware.js";
import { isAdminAuth } from "../middlewares/isAdminAuth.middleware.js";
import { home, registerUser, loginUser, forgetPassword, updateProfile, changePassword, getCurrentUser, logout } from "../controllers/user.controller.js";
import { requestLOR, getAllLorsOfLoggedInUser } from "../controllers/student.controller.js";
import { registerAsAdmin, updateLORrequest, approveLORrequest, rejectLORrequest, getAllPendingLOR, getAllApprovedLOR, getAllRejectedLOR, findLorsByExamRollNumber } from "../controllers/admin.controller.js";



// ######################   GENERAL ROUTES ############################
router.route("/").get(home);
router.route("/registerUser").post(registerUser); // Later on We set this that only Admin can Register User
router.route("/loginUser").post(loginUser);
router.route("/forgetPassword").post(forgetPassword);


//  ##################### GENERAL SECURED ROUTES  #################

router.route("/updateProfile").put(userAuth, updateProfile);
router.route("/changePassword").put(userAuth, changePassword);
router.route("/getCurrentUser").get(userAuth, getCurrentUser)
router.route("/logout").post(userAuth, logout);



// #######################   STUDENT SECURED ROUTES ############################

router.route("/requestLOR").post(userAuth, isStudentAuth, requestLOR);
router.route("/getAllLorsOfLoggedInUser").get(userAuth, isStudentAuth, getAllLorsOfLoggedInUser);


//  #######################   ADMIN SECURED ROUTES   ####################### 

router.route("/registerAsAdmin").post(registerAsAdmin); // We have To modify this in later- Set that Only admin can entroll other Admin
router.route("/:lorId/updateLORrequest").put(userAuth, isAdminAuth, updateLORrequest);
router.route("/:lorId/approveLORrequest").post(userAuth, isAdminAuth, approveLORrequest);
router.route("/:lorId/rejectLORrequest").post(userAuth, isAdminAuth, rejectLORrequest);
router.route("/allPendingLOR").get(userAuth, isAdminAuth, getAllPendingLOR);
router.route("/allApprovedLOR").get(userAuth, isAdminAuth, getAllApprovedLOR);
router.route("/allRejectedLOR").get(userAuth, isAdminAuth, getAllRejectedLOR);
router.route("/findLorsByExamRollNumber").get(userAuth, isAdminAuth, findLorsByExamRollNumber);











export default router;