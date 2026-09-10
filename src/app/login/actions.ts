"use server"

import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { signIn } from "@/auth"

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", Object.fromEntries(formData), { redirectTo: "/" })
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        redirect("/login?error=InvalidCredentials")
      }
      redirect("/login?error=SystemError")
    }
    throw error // Re-throw redirect errors!
  }
}
