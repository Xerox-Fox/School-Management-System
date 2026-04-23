import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth } from "../firebase/auth.js";
import { db } from "../firebase/db.js";

/* REGISTER */
export async function register(email, password, userData) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", userCred.user.uid), {
    uid: userCred.user.uid,
    ...userData
  });

  return userCred.user;
}

/* LOGIN */
export async function login(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, "users", userCred.user.uid));

  return {
    auth: userCred.user,
    profile: snap.data()
  };
}

/* LOGOUT */
export async function logout() {
  return signOut(auth);
}