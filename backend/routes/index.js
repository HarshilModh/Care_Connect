import userRouter from "./user.Routes.js";
import familyGroupRoutes from "./familyGroups.js";
import membershipRouter from "./memberShip.Routes.js";
import notificationRoutes from "./notifications.js";

const constructMethod = (app) => {
  app.use("/api/users", userRouter);
  app.use("/api/family-groups", familyGroupRoutes);
  app.use("/api/memberships", membershipRouter);
  app.use("/api/notifications", notificationRoutes);
};

export default constructMethod;
