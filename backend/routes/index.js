import userRouter from "./user.Routes.js";
import familyGroupRoutes from "./familyGroups.js";
import membershipRouter from "./memberShip.Routes.js";

const constructMethod = (app) => {
  app.use("/api/users", userRouter);
  app.use("/api/family-groups", familyGroupRoutes);
  app.use("/api/memberships", membershipRouter);
};

export default constructMethod;
