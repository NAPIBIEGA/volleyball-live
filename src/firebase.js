// Firebase configuration and helpers
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQDbVPZB55nq4SnOuLDC7-gieFJOckCQA",
  authDomain: "volleyballlive-abfaa.firebaseapp.com",
  projectId: "volleyballlive-abfaa",
  storageBucket: "volleyballlive-abfaa.firebasestorage.app",
  messagingSenderId: "247638603103",
  appId: "1:247638603103:web:dd6c41ff1ce1a6e7b0f2ea",
  measurementId: "G-1WKZZDM162"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Zapisz turniej (dokument w kolekcji "tournaments", kluczowany po jego id).
export async function saveTournament(tournament) {
  if (!tournament?.id) throw new Error("saveTournament: brak tournament.id");
  await setDoc(doc(db, "tournaments", tournament.id), {
    ...tournament,
    updatedAt: Date.now(),
  });
}

// Wczytaj pojedynczy turniej po id (zwraca null, gdy nie istnieje).
export async function loadTournament(id) {
  const snap = await getDoc(doc(db, "tournaments", id));
  return snap.exists() ? snap.data() : null;
}

// Usuń turniej z chmury.
export async function deleteTournament(id) {
  await deleteDoc(doc(db, "tournaments", id));
}
