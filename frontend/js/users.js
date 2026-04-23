import { db } from "../firebase/db.js";
import { collection, getDocs } from "firebase/firestore";

export async function getUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => d.data());
}