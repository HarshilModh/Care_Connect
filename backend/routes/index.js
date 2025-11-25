import userRouter from "./user.Routes.js";
import familyGroupRoutes from "./familyGroups.js";
import membershipRouter from "./memberShip.Routes.js";
import careRecipientsRouter from "./careRecipients.Routes.js";
import careGiversRouter from "./careGivers.Routes.js";
import notificationRoutes from "./notifications.js";
import taskRoutes from "./task.Routes.js";

const constructMethod = (app) => {
  app.use("/api/users", userRouter);
  app.use("/api/family-groups", familyGroupRoutes);
  app.use("/api/memberships", membershipRouter);
  app.use("/api/care-recipients", careRecipientsRouter);
  app.use("/api/caregivers", careGiversRouter);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/tasks", taskRoutes);
};

export default constructMethod;
