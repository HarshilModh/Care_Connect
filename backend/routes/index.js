import userRouter from "./user.Routes.js";
import familyGroupRoutes from "./familyGroups.js";

const constructMethod = (app) => {
  app.use("/api/users", userRouter);
  app.use("/api/family-groups", familyGroupRoutes);
};

export default constructMethod;
