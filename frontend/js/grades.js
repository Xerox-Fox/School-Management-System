import { db } from "../firebase/db.js";
import { collection, addDoc, getDocs } from "firebase/firestore";

/* ADD GRADE */
export async function addGrade(data) {
  await addDoc(collection(db, "grades"), {
    ...data,
    total: Number(data.assessment) + Number(data.exam)
  });
}

/* GET GRADES */
export async function getGrades() {
  const snap = await getDocs(collection(db, "grades"));
  return snap.docs.map(d => d.data());
}