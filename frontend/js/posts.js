import { db } from "../firebase/db.js";
import { collection, addDoc, getDocs } from "firebase/firestore";

export async function createPost(data) {
  await addDoc(collection(db, "posts"), {
    ...data,
    created_at: new Date()
  });
}

export async function getPosts() {
  const snap = await getDocs(collection(db, "posts"));
  return snap.docs.map(d => d.data());
}