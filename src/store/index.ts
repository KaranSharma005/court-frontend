import { createAppStore } from "./app-store";
import { MainClient } from "../client";
import { CourtClient } from "../client/courts";
import { UserClient } from "../client/users";
import { ReaderC } from "../client/reader"
// import { AppConfig } from "../config/index";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const mainClient = new MainClient(backendUrl);
export const courtClient = new CourtClient(backendUrl);
export const userClient = new UserClient(backendUrl);
export const ReaderClient = new ReaderC(backendUrl);

export const useAppStore = createAppStore(mainClient);
