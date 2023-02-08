import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { addDoc } from "firebase/firestore";
import { ref } from "vue";
import { dbUsersRef } from "../firebase";

export default function useAuth() {
  const auth = getAuth();
  const errorMessage = ref("");
  const signInModalOpen = ref(false);
  const userData = ref(null);

  function toggleModal() {
    signInModalOpen.value = !signInModalOpen.value;
  }

  async function signUp(email, password) {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userObject = {
        createdAt: new Date(),
        linkedId: user.uid,
        email: user.email,
        isAdmin: false,
      };
      await addDoc(dbUsersRef, userObject);
      errorMessage.value = "";
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage.value =
            "a user with that email already exists, please log in";
          break;
        case "auth/weak-password":
          errorMessage.value = "password should be at least 6 characters long";
          break;
        default:
          errorMessage.value = "sorry, there was an unexpected error";
      }
    }
  }

  async function logIn(email, password) {
    if (!email) return (errorMessage.value = "Please enter a valid email");
    if (!password)
      return (errorMessage.value = "Please enter a valid password");
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      errorMessage.value = "";
      signInModalOpen.value = false;
    } catch (error) {
      switch (error.code) {
        case "auth/wrong-password":
          errorMessage.value = "incorrect password";
          break;
        case "auth/user-not-found":
          errorMessage.value = "no user found with that email";
          break;
        default:
          errorMessage.value = "sorry, there was an unexpected error";
      }
    }
  }
  function logOut() {
    try {
      signOut(auth);
    } catch (error) {
      errorMessage.value = error.message;
    }
  }

  onAuthStateChanged(auth, function (user) {
    if (user) {
      userData.value = user;
    } else {
      userData.value = null;
    }
  });
  return {
    signUp,
    errorMessage,
    signInModalOpen,
    toggleModal,
    logIn,
    logOut,
    userData,
  };
}
