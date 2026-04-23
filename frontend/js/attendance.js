import { db } from "../firebase/db.js";
import { collection, addDoc, getDocs } from "firebase/firestore";

/* MARK ATTENDANCE */
export async function markAttendance(data) {
  await addDoc(collection(db, "attendance"), {
    ...data,
    date: new Date().toISOString().split("T")[0]
  });
}

/* GET ATTENDANCE */
export async function getAttendance() {
  const snap = await getDocs(collection(db, "attendance"));
  return snap.docs.map(d => d.data());
}